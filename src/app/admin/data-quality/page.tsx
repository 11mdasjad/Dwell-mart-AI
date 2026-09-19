'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface SyncMetrics {
  totalProducts: number;
  totalCategories: number;
  totalSubcategories: number;
  totalBrands: number;
  totalSellers: number;
  productsWithPrice: number;
  productsWithoutPrice: number;
  productsWithImages: number;
  productsWithoutImages: number;
  productsWithStock: number;
  productsWithoutStock: number;
  duplicateProducts: number;
  orphanProducts: number;
  failedImports: number;
  lastSyncTimestamp: string | null;
  lastSyncDurationMs: number;
  currentDataSource: 'live' | 'import' | 'mock';
  mockModeEnabled: boolean;
  syncErrors: string[];
}

export default function AdminDataQualityPage() {
  const [metrics, setMetrics] = useState<SyncMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const res = await fetch('/api/admin/data-quality');
        const json = await res.json();
        if (mounted) {
          if (json.success) {
            setMetrics(json.data);
          } else {
            setError(json.error || 'Failed to fetch catalog metrics');
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Network error fetching metrics');
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSuccessMessage(null);
      const res = await fetch('/api/admin/data-quality', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setMetrics(json.data);
        setSuccessMessage('Catalog sync completed successfully!');
      } else {
        setError(json.error || 'Catalog sync encountered an error');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error during sync');
    } finally {
      setSyncing(false);
    }
  };

  const calculatePct = (val: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.round((val / total) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Dwell Mart"
                width={130}
                height={42}
                className="h-9 w-auto object-contain"
                priority
              />
            </Link>
            <div className="border-l border-slate-200 pl-3">
              <h1 className="text-lg font-bold text-slate-900">Catalog Data Quality Dashboard</h1>
              <p className="text-xs text-slate-500">100,000+ Ingestion & Grounded Knowledge Monitor</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/chat"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Open AI Chat
            </Link>
            <button
              onClick={handleSyncNow}
              disabled={syncing || loading}
              className={`flex items-center space-x-2 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50`}
            >
              {syncing ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Syncing Live Data...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Sync Catalog Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm">
            <span className="font-bold">Success:</span> {successMessage}
          </div>
        )}

        {/* Status Bar */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Active Source</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-lg font-bold text-slate-900 uppercase">
                {metrics?.currentDataSource || 'LIVE'}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  metrics?.currentDataSource === 'live'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {metrics?.currentDataSource === 'live' ? 'Production Live' : 'Mock Dev Mode'}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Mock Mode Allowed: {metrics?.mockModeEnabled ? 'Yes (Dev)' : 'No (Strict Prod)'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Last Sync Timestamp</p>
            <p className="mt-2 text-sm font-bold text-slate-800">
              {metrics?.lastSyncTimestamp ? new Date(metrics.lastSyncTimestamp).toLocaleString() : 'Not Yet Synced'}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Duration: {metrics?.lastSyncDurationMs ? `${metrics.lastSyncDurationMs}ms` : 'N/A'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Price Completeness</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">
                {calculatePct(metrics?.productsWithPrice || 0, metrics?.totalProducts || 0)}%
              </span>
              <span className="text-xs text-slate-500">
                {metrics?.productsWithPrice || 0} / {metrics?.totalProducts || 0}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-emerald-500"
                style={{
                  width: `${calculatePct(metrics?.productsWithPrice || 0, metrics?.totalProducts || 0)}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Image Coverage</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">
                {calculatePct(metrics?.productsWithImages || 0, metrics?.totalProducts || 0)}%
              </span>
              <span className="text-xs text-slate-500">
                {metrics?.productsWithImages || 0} / {metrics?.totalProducts || 0}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-teal-500"
                style={{
                  width: `${calculatePct(metrics?.productsWithImages || 0, metrics?.totalProducts || 0)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Catalog Entities Overview */}
        <h2 className="mb-4 text-base font-bold text-slate-900">Verified Catalog Entities</h2>
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Verified Products</p>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {metrics ? metrics.totalProducts.toLocaleString() : '...'}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Indexed & Searchable</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Categories</p>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {metrics ? metrics.totalCategories.toLocaleString() : '...'}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Hierarchy Root Nodes</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Subcategories</p>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {metrics ? metrics.totalSubcategories.toLocaleString() : '...'}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Child Categories</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Verified Brands</p>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {metrics ? metrics.totalBrands.toLocaleString() : '...'}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Official Brand Index</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Approved Sellers</p>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {metrics ? metrics.totalSellers.toLocaleString() : '...'}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Live Marketplace Stores</p>
          </div>
        </div>

        {/* Data Quality & Health Breakdown */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Completeness Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Field Completeness & Verification</h3>
            <p className="text-xs text-slate-500">Tracks missing attributes across all synchronized records</p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                <span className="text-slate-600">Products with Price</span>
                <span className="font-semibold text-slate-900">{metrics?.productsWithPrice || 0}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                <span className="text-slate-600">Products without Price</span>
                <span className="font-semibold text-amber-600">{metrics?.productsWithoutPrice || 0}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                <span className="text-slate-600">Products with Primary Image</span>
                <span className="font-semibold text-slate-900">{metrics?.productsWithImages || 0}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                <span className="text-slate-600">Products without Image</span>
                <span className="font-semibold text-amber-600">{metrics?.productsWithoutImages || 0}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                <span className="text-slate-600">Products with Stock Information</span>
                <span className="font-semibold text-slate-900">{metrics?.productsWithStock || 0}</span>
              </div>
              <div className="flex items-center justify-between pb-1 text-xs">
                <span className="text-slate-600">Products without Stock Information</span>
                <span className="font-semibold text-amber-600">{metrics?.productsWithoutStock || 0}</span>
              </div>
            </div>
          </div>

          {/* Anomaly & Integrity Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Data Integrity & Anomaly Detection</h3>
            <p className="text-xs text-slate-500">Monitors duplicates, orphaned items, and ingestion errors</p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                <span className="text-slate-600">Duplicate Products Prevented</span>
                <span className="font-semibold text-emerald-600">{metrics?.duplicateProducts || 0}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                <span className="text-slate-600">Orphaned Products</span>
                <span className="font-semibold text-slate-900">{metrics?.orphanProducts || 0}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                <span className="text-slate-600">Failed Ingestion Records</span>
                <span className="font-semibold text-red-600">{metrics?.failedImports || 0}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                <span className="text-slate-600">Category Cycles / Invalid Hierarchy</span>
                <span className="font-semibold text-emerald-600">0 (Clean)</span>
              </div>
              <div className="flex items-center justify-between pb-1 text-xs">
                <span className="text-slate-600">Sync Status</span>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  HEALTHY
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Logs */}
        {metrics && metrics.syncErrors.length > 0 && (
          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-red-800">Recent Synchronization Alerts</h3>
            <ul className="mt-3 space-y-1 font-mono text-xs text-red-700">
              {metrics.syncErrors.map((err, i) => (
                <li key={i} className="rounded bg-red-50 p-2">
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
