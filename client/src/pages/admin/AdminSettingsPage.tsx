import { useState, useEffect } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
        JSON.parse(adminInfoStr);
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
      toast.info("Please scan the QR code with Google Authenticator");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error creating 2FA code");
    } finally {
      setProcessing(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!code || code.length !== 6) {
      toast.error("Please enter all 6 digits");
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
      toast.success("2FA enabled successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Incorrect confirmation code");
    } finally {
      setProcessing(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!code || code.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }
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
                <p className="text-xs text-gray-500 mb-1">Or enter code manually:</p>
                <code className="text-sm font-bold bg-white px-2 py-1 rounded">{secret}</code>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Enter 6-digit code from the app:</label>
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
                <label className="text-sm font-bold">Enter 6-digit code to disable 2FA:</label>
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
