"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/RequireAuth";
import { SignOutButton } from "@/components/SignOutButton";
import { useRouter } from "next/navigation";

const LOGO_OPTIONS = [
  { label: "Tower", value: "tower" },
  { label: "Skyscraper", value: "skyscraper" },
  { label: "Mansion", value: "mansion" },
  { label: "Modern", value: "modern" },
  { label: "Classic", value: "classic" },
];

const FOCUS_OPTIONS = [
  "Balanced Portfolio",
  "Residential",
  "Commercial",
  "Luxury",
  "Affordable",
];

export default function BankPage() {
  const [tab, setTab] = useState<"create" | "join">("create");

  return (
    <RequireAuth>
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 relative">
        <div className="absolute top-6 right-6">
          <SignOutButton />
        </div>
        <div className="w-full max-w-xl bg-card rounded-2xl shadow-xl p-8">
          <div className="flex gap-4 mb-8">
            <Button variant={tab === "create" ? "default" : "outline"} onClick={() => setTab("create")}>Create Investment Bank</Button>
            <Button variant={tab === "join" ? "default" : "outline"} onClick={() => setTab("join")}>Join Existing Bank</Button>
          </div>
          {tab === "create" ? <CreateBankForm /> : <JoinBankList />}
        </div>
      </div>
    </RequireAuth>
  );
}

function CreateBankForm() {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState(LOGO_OPTIONS[0].value);
  const [focus, setFocus] = useState(FOCUS_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    let bankName = name.trim();
    if (!bankName.endsWith(" Oy")) {
      bankName += " Oy";
    }
    const { data, error } = await supabase.from("investment_bank").insert({
      name: bankName,
      logo,
      focus,
      balance: 10000000,
    }).select().single();
    setLoading(false);
    if (error) {
      setError(error.message);
    } else if (data) {
      setSuccess(true);
      setName("");
      setLogo(LOGO_OPTIONS[0].value);
      setFocus(FOCUS_OPTIONS[0]);
      // Connect player to this bank (id and name)
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        await supabase.from("players").update({ investment_bank_id: data.id, investment_bank: data.name }).eq("user_id", user.id);
        // Redirect to dashboard after successful creation
        router.push("/bank/dashboard");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-center">Create Your Investment Bank</h2>
      <div>
        <label className="block font-medium mb-1">Bank Name</label>
        <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Enter your bank's name" />
      </div>
      <div>
        <label className="block font-medium mb-1">Bank Logo</label>
        <div className="flex gap-2">
          {LOGO_OPTIONS.map(opt => (
            <button
              type="button"
              key={opt.value}
              className={`rounded-lg border px-4 py-2 flex flex-col items-center gap-1 ${logo === opt.value ? "border-primary bg-primary/10" : "border-border"}`}
              onClick={() => setLogo(opt.value)}
            >
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">{opt.label[0]}</div>
              <span className="text-xs mt-1">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block font-medium mb-1">Investment Focus</label>
        <select className="w-full rounded-lg border p-2" value={focus} onChange={e => setFocus(e.target.value)}>
          {FOCUS_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Starting Capital</span>
        <span className="font-bold text-lg">€10,000,000</span>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Establishing..." : "Establish Bank"}</Button>
      {success && <div className="text-green-600 text-center">Bank created successfully!</div>}
      {error && <div className="text-red-600 text-center">{error}</div>}
    </form>
  );
}

function JoinBankList() {
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    supabase.from("investment_bank").select("*").then(({ data, error }) => {
      setBanks(data || []);
      setError(error ? error.message : "");
      setLoading(false);
    });
  }, []);

  const handleJoin = async (bankId: string, bankName: string) => {
    setLoading(true);
    setError("");
    const user = (await supabase.auth.getUser()).data.user;
    if (user) {
      const { error } = await supabase.from("players").update({ investment_bank_id: bankId, investment_bank: bankName }).eq("user_id", user.id);
      if (error) {
        setError(error.message);
      } else {
        // Redirect to dashboard after successful join
        router.push("/bank/dashboard");
      }
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-4">Join an Investment Bank</h2>
      {loading && <div>Loading banks...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div className="space-y-4">
        {banks.map(bank => (
          <div key={bank.id} className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-xl font-bold">{bank.logo ? bank.logo[0] : "🏦"}</div>
            <div className="flex-grow">
              <div className="font-semibold text-lg">{bank.name}</div>
              <div className="text-xs text-muted-foreground">{bank.focus}</div>
            </div>
            <Button onClick={() => handleJoin(bank.id, bank.name)}>Join</Button>
          </div>
        ))}
        {(!loading && banks.length === 0) && <div className="text-center text-muted-foreground">No banks found.</div>}
      </div>
    </div>
  );
} 