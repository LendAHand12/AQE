import { useState, useEffect } from "react";
import { ShieldCheck, Loader2, Settings2, Save, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import apiClient from "@/lib/axios";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { invalidateExchangeRateCache } from "@/hooks/useExchangeRate";

interface ConfigDoc {
  _id: string;
  key: string;
  label: string;
  value: number;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [processing, setProcessing] = useState(false);

  // Config state
  const [configs, setConfigs] = useState<ConfigDoc[]>([]);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const adminInfoStr = localStorage.getItem("admin_info");
    if (adminInfoStr) {
      try { JSON.parse(adminInfoStr); } catch (e) {}
    }
    setLoading(false);
  }, []);

  const fetchConfigs = async () => {
    setConfigLoading(true);
    try {
      const res = await apiClient.get("/admin/config", {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
      });
      const docs: ConfigDoc[] = res.data;
      setConfigs(docs);
      const vals: Record<string, string> = {};
      docs.forEach((d) => { vals[d.key] = String(d.value); });
      setConfigValues(vals);
    } catch {
      toast.error("Failed to load system configuration");
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleSaveConfig = async (key: string) => {
    const value = configValues[key];
    if (value === undefined || value === "") {
      toast.error("Please enter a value");
      return;
    }
    setConfigSaving((prev) => ({ ...prev, [key]: true }));
    try {
      await apiClient.put(
        `/admin/config/${key}`,
        { value: parseFloat(value) },
        { headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` } }
      );
      toast.success("Configuration updated successfully!");
      // Invalidate client-side exchange rate cache if rate changed
      if (key === "aqeToUsdtRate") {
        invalidateExchangeRateCache();
      }
      fetchConfigs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setConfigSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleGenerate2FA = async () => {
    try {
      setProcessing(true);
      const res = await apiClient.get("/admin/2fa/generate", {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
      });
      setQrCodeUrl(res.data.qrCodeUrl);
      setSecret(res.data.secret);
      toast.info("Please scan the QR code with Google Authenticator");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate 2FA code");
    } finally {
      setProcessing(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!code || code.length !== 6) { toast.error("Please enter all 6 digits"); return; }
    try {
      setProcessing(true);
      await apiClient.post("/admin/2fa/enable", { code }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
      });
      setIsTwoFactorEnabled(true);
      setQrCodeUrl(""); setSecret(""); setCode("");
      toast.success("2FA enabled successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Incorrect confirmation code");
    } finally {
      setProcessing(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!code || code.length !== 6) { toast.error("Please enter all 6 digits"); return; }
    try {
      setProcessing(true);
      await apiClient.post("/admin/2fa/disable", { code }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
      });
      setIsTwoFactorEnabled(false);
      setCode("");
      toast.success("2FA disabled successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Incorrect confirmation code");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#276152]" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* ── Exchange Rate & System Config ── */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="border-b pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-[#276152]" />
                System Configuration
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">AQE/USDT exchange rate and financial parameters</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchConfigs}
              disabled={configLoading}
              className="rounded-[10px]"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${configLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {configLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-[#276152] w-6 h-6" />
            </div>
          ) : configs.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No configurations found. Please run the seed script.</p>
          ) : (
            <div className="space-y-4">
              {configs.map((cfg) => (
                <div key={cfg.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-[12px] border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{cfg.label}</p>
                    <p className="text-xs text-gray-400 font-mono">{cfg.key}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      value={configValues[cfg.key] ?? ""}
                      onChange={(e) =>
                        setConfigValues((prev) => ({ ...prev, [cfg.key]: e.target.value }))
                      }
                      className="h-9 w-32 rounded-[10px] text-right font-mono font-bold text-[#276152]"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveConfig(cfg.key)}
                      disabled={configSaving[cfg.key]}
                      className="h-9 px-3 rounded-[10px] bg-[#276152] hover:bg-[#1e4d40]"
                    >
                      {configSaving[cfg.key]
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Save className="w-3.5 h-3.5" />
                      }
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 italic">
            * Rate changes take effect immediately for all subsequent transactions.
          </p>
        </CardContent>
      </Card>

      {/* ── Two-Factor Authentication ── */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold">Two-Factor Authentication (2FA)</h2>
            <p className="text-sm text-gray-500">Use Google Authenticator to protect your account</p>
          </div>

          {!isTwoFactorEnabled && !qrCodeUrl && (
            <div>
              <Button onClick={handleGenerate2FA} disabled={processing} className="bg-[#276152]">
                {processing ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                Enable 2FA
              </Button>
            </div>
          )}

          {qrCodeUrl && (
            <div className="space-y-4 max-w-sm">
              <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center border">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mb-4 bg-white p-2 rounded" />
                <p className="text-xs text-gray-500 mb-1">Or enter the code manually:</p>
                <code className="text-sm font-bold bg-white px-2 py-1 rounded">{secret}</code>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Enter the 6-digit code from your app:</label>
                <div className="flex justify-center py-2">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                      <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button onClick={handleEnable2FA} disabled={processing} className="w-full bg-[#276152]">
                  {processing ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                  Confirm Enable
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setQrCodeUrl("")}>Cancel</Button>
              </div>
            </div>
          )}

          {isTwoFactorEnabled && (
            <div className="space-y-4 max-w-sm">
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-sm font-bold">2FA is currently enabled</span>
              </div>
              <div className="space-y-2 pt-4">
                <label className="text-sm font-bold">Enter the 6-digit code to disable 2FA:</label>
                <div className="flex justify-center py-2">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                      <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button onClick={handleDisable2FA} disabled={processing} variant="destructive" className="w-full">
                  {processing ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                  Confirm Disable
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

