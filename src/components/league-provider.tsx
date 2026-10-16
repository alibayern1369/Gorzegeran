"use client";
import { createContext, useContext, useMemo } from "react";
import type { PlayerSeed } from "@/lib/constants";

const Context = createContext<PlayerSeed[]>([]);
export function LeagueProvider({
  players,
  children,
}: {
  players: PlayerSeed[];
  children: React.ReactNode;
}) {
  return <Context.Provider value={players}>{children}</Context.Provider>;
}
export function useLeaguePlayers() {
  const players = useContext(Context);
  return useMemo(
    () => ({ players, playerById: new Map(players.map((p) => [p.id, p])) }),
    [players],
  );
}
