import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, MapPin, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/site/PublicLayout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact ResuMate — Get Support" },
      {
        name: "description",
        content:
          "Questions about your resume analysis or account? Send the ResuMate team a message.",
      },
      { property: "og:title", content: "Contact ResuMate — Get Support" },
      { property: "og:description", content: "We usually reply within one working day." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [error, setError] = useState("");
  return (
    <PublicLayout>
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-4xl font-extrabold">Contact us</h1>
          <p className="mt-3 text-muted-foreground">
            Stuck on something? Tell us what happened and we'll help you fix it.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex items-center gap-3">
              <Mail className="size-4 text-primary" /> support@resumate.app
            </li>
            <li className="flex items-center gap-3">
              <MessagesSquare className="size-4 text-primary" /> Live chat, 10:00–18:00
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="size-4 text-primary" /> Dhaka, Bangladesh
            </li>
          </ul>
        </div>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                if (!String(form.get("message") ?? "").trim()) {
                  setError("Please write a short message so we know how to help.");
                  return;
                }
                setError("");
                toast.success("Message sent ✓", {
                  description: "We'll reply within one working day.",
                });
                e.currentTarget.reset();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" required placeholder="Arpita Das" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" rows={5} placeholder="How can we help?" />
                {error ? <p className="text-xs text-destructive">{error}</p> : null}
              </div>
              <Button type="submit" variant="hero" className="w-full">
                Send message
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </PublicLayout>
  );
}
