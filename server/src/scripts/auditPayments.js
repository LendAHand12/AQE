// Audits past USDT payments (confirmed before on-chain verification existed) against the blockchain.
// Usage: npm run audit-payments [-- --all]   (default: only SUCCESS orders; --all also lists every status)
// Output: server/audit-payments-<timestamp>.txt  (read-only: nothing in the database is changed)
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import WalletConnection from '../models/WalletConnection.js';
import { rpc, USDT_ADDRESS, TRANSFER_TOPIC, addrFromTopic } from '../services/usdtVerifier.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const includeAll = process.argv.includes('--all');
const TOLERANCE = 0.99; // same 1% tolerance the old confirm flow used

// The production receiving wallet that real payments were sent to (override with AUDIT_RECEIVER_WALLET)
const companyWallets = new Set(
    [process.env.AUDIT_RECEIVER_WALLET || '0x19Bee4425878e2f802d6De59c24175e4Bb29D939'].map((a) => a.toLowerCase())
);

const HASH_RE = /^0x[0-9a-fA-F]{64}$/;

async function auditOne(tx, user, userWallets, hashCount) {
    const flags = [];
    const info = {};
    const hash = tx.hash;

    if (tx.metadata?.suspicious) {
        flags.push(`Flagged at confirm time: ${(tx.metadata.suspicious.reasons || []).join(' | ')}`);
    }

    if (!hash || !HASH_RE.test(hash)) {
        const manual = /approved by|manual/i.test(`${hash || ''} ${tx.description || ''}`) || tx.metadata?.method === 'ZELLE' || tx.metadata?.isManual;
        if (manual) {
            info.note = 'Manual/Zelle payment approved by admin (no tx hash to check)';
        } else {
            flags.push(`No valid tx hash on a ${tx.status} order (hash: ${hash || 'none'})`);
        }
        return { flags, info };
    }

    if (hashCount.get(hash.toLowerCase()) > 1) flags.push('Same tx hash used by more than one order');

    let receipt;
    try {
        receipt = await rpc((p) => p.getTransactionReceipt(hash));
    } catch (e) {
        flags.push(`RPC error, could not check: ${e.shortMessage || e.message}`);
        return { flags, info };
    }
    if (!receipt) {
        flags.push('Transaction not found on BSC');
        return { flags, info };
    }
    if (receipt.status !== 1) flags.push('Transaction FAILED on-chain');

    const toCompany = receipt.logs.filter((l) =>
        l.address.toLowerCase() === USDT_ADDRESS &&
        l.topics.length === 3 && l.topics[0] === TRANSFER_TOPIC &&
        companyWallets.has(addrFromTopic(l.topics[2]))
    );

    if (!toCompany.length) {
        const anyUsdt = receipt.logs.filter((l) => l.address.toLowerCase() === USDT_ADDRESS && l.topics[0] === TRANSFER_TOPIC);
        flags.push(anyUsdt.length
            ? `USDT moved, but not to a company wallet (to: ${[...new Set(anyUsdt.map((l) => addrFromTopic(l.topics[2])))].join(', ')})`
            : 'No USDT transfer in this transaction');
        return { flags, info };
    }

    const total = toCompany.reduce((s, l) => s + BigInt(l.data), 0n);
    const paid = Number(ethers.formatUnits(total, 18));
    info.paidOnChain = paid;
    if (paid < tx.amount * TOLERANCE) flags.push(`Underpaid: on-chain ${paid} USDT < order ${tx.amount} USDT`);

    try {
        const block = await rpc((p) => p.getBlock(receipt.blockNumber));
        info.blockTime = block ? new Date(block.timestamp * 1000) : null;
        if (block && block.timestamp * 1000 < new Date(tx.createdAt).getTime() - 10 * 60 * 1000) {
            flags.push(`Tx mined BEFORE the order was created (${info.blockTime.toISOString()} < ${new Date(tx.createdAt).toISOString()})`);
        }
    } catch { /* non-fatal */ }

    return { flags, info };
}

async function main() {
    await mongoose.connect(process.env.MONGO_URI);

    const statuses = includeAll ? undefined : ['SUCCESS'];
    const query = { type: 'PAYMENT', symbol: 'USDT' };
    if (statuses) query.status = { $in: statuses };
    const txs = await Transaction.find(query).sort({ createdAt: 1 });
    console.log(`Auditing ${txs.length} payment(s)...`);

    const hashCount = new Map();
    for (const t of txs) if (t.hash) hashCount.set(t.hash.toLowerCase(), (hashCount.get(t.hash.toLowerCase()) || 0) + 1);

    const suspicious = [];
    let clean = 0, manual = 0;

    for (let i = 0; i < txs.length; i++) {
        const tx = txs[i];
        const user = await User.findById(tx.from).select('username fullName email walletAddress');
        const conns = await WalletConnection.find({ user: tx.from }).select('walletAddress');
        const wallets = new Set([user?.walletAddress, ...conns.map((c) => c.walletAddress)].filter(Boolean).map((a) => a.toLowerCase()));

        const { flags, info } = await auditOne(tx, user, wallets, hashCount);
        if (flags.length) suspicious.push({ tx, user, flags, info });
        else if (info.note) manual++;
        else clean++;
        process.stdout.write(`\r${i + 1}/${txs.length}`);
    }
    console.log('');

    const lines = [];
    lines.push('USDT PAYMENT AUDIT');
    lines.push(`Generated : ${new Date().toISOString()}`);
    lines.push(`Scope     : ${includeAll ? 'all statuses' : 'SUCCESS only'}`);
    lines.push(`Receivers : ${[...companyWallets].join(', ')}`);
    lines.push(`Checked   : ${txs.length}   Clean: ${clean}   Manual/Zelle: ${manual}   SUSPICIOUS: ${suspicious.length}`);
    lines.push('='.repeat(80));

    suspicious.forEach(({ tx, user, flags, info }, n) => {
        lines.push('');
        lines.push(`#${n + 1}  Payment ID ${tx.paymentId ?? '-'}   status ${tx.status}`);
        lines.push(`  User      : ${user?.fullName || '?'} (@${user?.username || '?'})  <${user?.email || '?'}>  id ${tx.from}`);
        lines.push(`  User wallet: ${user?.walletAddress || 'none'}`);
        lines.push(`  Amount    : ${tx.amount} ${tx.symbol}${info.paidOnChain !== undefined ? `   (on-chain: ${info.paidOnChain})` : ''}`);
        lines.push(`  Tx hash   : ${tx.hash || 'none'}`);
        if (tx.hash && HASH_RE.test(tx.hash)) lines.push(`  BscScan   : https://bscscan.com/tx/${tx.hash}`);
        lines.push(`  Created   : ${new Date(tx.createdAt).toISOString()}`);
        lines.push(`  Description: ${tx.description || ''}`);
        lines.push('  Reasons:');
        flags.forEach((f) => lines.push(`    - ${f}`));
    });
    if (!suspicious.length) lines.push('\nNo suspicious payments found.');

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(__dirname, `../../audit-payments-${stamp}.txt`);
    fs.writeFileSync(file, lines.join('\n') + '\n', 'utf8');
    console.log(`Clean ${clean}, manual ${manual}, suspicious ${suspicious.length}`);
    console.log(`Report: ${file}`);
    await mongoose.disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
