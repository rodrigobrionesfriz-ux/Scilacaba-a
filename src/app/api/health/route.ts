import { NextResponse } from "next/server"

// Healthcheck de liveness para Railway (Fase 12). Shallow a propósito: no toca la
// DB → un blip transitorio de Postgres no marca el deploy como unhealthy (la
// conectividad real la validan las migraciones del preDeploy y las queries). El
// matcher de proxy.ts excluye /api → no lo redirige a /login.
export const dynamic = "force-dynamic"

export const GET = () => NextResponse.json({ status: "ok" }, { status: 200 })
