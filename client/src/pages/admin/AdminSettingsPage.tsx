import React, { useState, useEffect } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
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

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [processing, setProcessing] = useState(false);

  // Fetch admin profile to check if 2FA is enabled
  useEffect(() => {
    // In a real app we might have a profile endpoint, but for now we can infer from local storage
    const adminInfoStr = localStorage.getItem("admin_info");
    if (adminInfoStr) {
      try {
        const adminInfo = JSON.parse(adminInfoStr);
        // Note: we'd need the API to return this, but let's assume we don't have it yet.
        // As a workaround, we will always show the "Enable 2FA" button unless they already have it.
        // For accurate status, we need an admin profile API. I will assume it's disabled initially.
        // To be safe, if we don't know, we let them try to enable it.
      } catch (e) {}
    }
    setLoading(false);
  }, []);

  const handleGenerate2FA = async () => {
    try {
      setProcessing(true);
      const res = await apiClient.get("/admin/2fa/generate", {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
      });
      setQrCodeUrl(res.data.qrCodeUrl);
      setSecret(res.data.secret);
      toast.info("Vui lòng quét mã QR bằng Google Authenticator");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi tạo mã 2FA");
    } finally {
      setProcessing(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!code || code.length !== 6) {
      toast.error("Vui lòng nhập đủ 6 số");
      return;
    }
    try {
      setProcessing(true);
      await apiClient.post("/admin/2fa/enable", { code }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
      });
      setIsTwoFactorEnabled(true);
      setQrCodeUrl("");
      setSecret("");
      setCode("");
      toast.success("Bật 2FA thành công!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Mã xác nhận không đúng");
    } finally {
      setProcessing(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!code || code.length !== 6) {
      toast.error("Vui lòng nhập đủ 6 số");
      return;
    }
    try {
      setProcessing(true);
      await apiClient.post("/admin/2fa/disable", { code }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
      });
      setIsTwoFactorEnabled(false);
      setCode("");
      toast.success("Tắt 2FA thành công!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Mã xác nhận không đúng");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#276152]" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">


      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold">Bảo mật 2 lớp (2FA)</h2>
            <p className="text-sm text-gray-500">Sử dụng ứng dụng Google Authenticator để bảo vệ tài khoản</p>
          </div>

          {!isTwoFactorEnabled && !qrCodeUrl && (
            <div>
              <Button onClick={handleGenerate2FA} disabled={processing} className="bg-[#276152]">
                {processing ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                Bật 2FA
              </Button>
            </div>
          )}

          {qrCodeUrl && (
            <div className="space-y-4 max-w-sm">
              <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center border">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mb-4 bg-white p-2 rounded" />
                <p className="text-xs text-gray-500 mb-1">Hoặc nhập mã thủ công:</p>
                <code className="text-sm font-bold bg-white px-2 py-1 rounded">{secret}</code>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Nhập mã 6 số từ ứng dụng:</label>
                <div className="flex justify-center py-2">
                    <InputOTP maxLength={6} value={code} onChange={setCode}>
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                </div>
                <Button onClick={handleEnable2FA} disabled={processing} className="w-full bg-[#276152]">
                  {processing ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                  Xác nhận bật
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setQrCodeUrl("")}>Hủy</Button>
              </div>
            </div>
          )}

          {isTwoFactorEnabled && (
            <div className="space-y-4 max-w-sm">
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-sm font-bold">2FA đang được bật</span>
              </div>
              <div className="space-y-2 pt-4">
                <label className="text-sm font-bold">Nhập mã 6 số để tắt 2FA:</label>
                <div className="flex justify-center py-2">
                    <InputOTP maxLength={6} value={code} onChange={setCode}>
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                </div>
                <Button onClick={handleDisable2FA} disabled={processing} variant="destructive" className="w-full">
                  {processing ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                  Xác nhận tắt
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
