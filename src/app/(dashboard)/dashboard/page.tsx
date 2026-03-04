"use client";

import { authClient } from "@/lib/auth/client";
import { useEffect, useState } from "react";
import { User, Users, Settings, LogOut, PlusCircle } from "lucide-react";

type SessionType = typeof authClient.$Infer.Session;

export default function Dashboard() {
  const [session, setSession] = useState<SessionType | null>(null);
  useEffect(() => {
    authClient.getSession().then((session) => {
      setSession(session.data);
    });
  }, []);

  const user = {
    name: session?.user.name,
    email: session?.user.email,
    image: session?.user.image
      ? session?.user.image
      : User,
  };

  return (
    <div>
      <h1>ProfileSample</h1>
    </div>
  );
}
