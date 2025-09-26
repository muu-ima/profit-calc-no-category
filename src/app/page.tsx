"use client";

import React, { useMemo, useEffect, useState } from "react";
import ChatIcon from "./components/ChatIcon";
import { getCheapestShipping, ShippingData } from "lib/shipping";
import ExchangeRate from "./components/ExchangeRate";
import Result from "./components/Result";
import {
  calculateFinalProfitDetailUS,
  calculateActualCost,
  calculateGrossProfit,
  calculateProfitMargin,
  calcBreakEvenUSD,
} from "lib/profitCalc";
import type { BreakEvenResult } from "lib/profitCalc";
import FinalResultModal from "./components/FinalResultModal";
import ModeSwitch, { type Mode } from "./components/ModeSwitch";
import { AnimatePresence, motion } from "framer-motion";

/* ====== 型 ====== */
type ShippingResult = { method: string; price: number | null; };
type ShippingMode = "auto" | "manual";
type CalcResult = {
  shippingJPY: number; categoryFeeJPY: number; actualCost: number;
  grossProfit: number; profitMargin: number; method: string; rate: number; sellingPriceJPY: number;
};

export default function Page() {
  const [shippingRates, setShippingRates] = useState<ShippingData | null>(null);
  const [costPrice, setCostPrice] = useState<number | "">("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [weight, setWeight] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ length: 0, width: 0, height: 0 });
  const [rate, setRate] = useState<number | null>(null);

  const [shippingMode, setShippingMode] = useState<ShippingMode>("auto");
  const [manualShipping, setManualShipping] = useState<number | "">("");
  const [result, setResult] = useState<ShippingResult | null>(null);
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("breakEven");
  const [be, setBe] = useState<BreakEvenResult | null>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // 自動/手動の送料を一元化
  const selectedShippingJPY: number | null =
    shippingMode === "manual" ? (manualShipping === "" ? null : Number(manualShipping)) : result?.price ?? null;

  // 送料データ
  useEffect(() => { fetch("/data/shipping.json").then(r => r.json()).then(setShippingRates); }, []);
  useEffect(() => { if (rate !== null) console.log(`最新為替レート：${rate}`); }, [rate]);

  // 自動計算
  useEffect(() => {
    if (shippingMode !== "auto") return;
    if (shippingRates && weight !== null && weight > 0) {
      setResult(getCheapestShipping(shippingRates, weight, dimensions));
    } else {
      setResult(null);
    }
  }, [shippingRates, weight, dimensions, shippingMode]);

  // BE
  useEffect(() => {
    const ready = rate !== null && costPrice !== "" && selectedShippingJPY !== null;
    if (!ready) { setBe(null); return; }
    const out = calcBreakEvenUSD({
      costJPY: Number(costPrice),
      shippingJPY: selectedShippingJPY!,
      rateJPYperUSD: rate!,
      categoryFeePercent: 0,
      exchangeFeeJPYPerUSD: 3.3,
    });
    if (
      !Number.isFinite(out.breakEvenUSD) || !Number.isFinite(out.dutyTotalUSD) ||
      !Number.isFinite(out.insuranceUSD) || !Number.isFinite(out.insuranceTotalUSD)
    ) { setBe(null); return; }
    setBe(out);
  }, [costPrice, rate, selectedShippingJPY]);

  // 収支
  useEffect(() => {
    const ready = sellingPrice !== "" && costPrice !== "" && rate !== null && selectedShippingJPY !== null;
    if (!ready) { setCalcResult(null); return; }
    const shippingJPY = selectedShippingJPY!;
    const sellingPriceUSD = parseFloat(sellingPrice);
    const sellingPriceJPY = sellingPriceUSD * rate!;
    const categoryFeeJPY = 0;
    const actualCost = calculateActualCost(Number(costPrice), shippingJPY, categoryFeeJPY);
    const grossProfit = calculateGrossProfit(sellingPriceJPY, actualCost);
    const profitMargin = calculateProfitMargin(grossProfit, sellingPriceJPY);
    setCalcResult({
      shippingJPY, categoryFeeJPY, actualCost, grossProfit, profitMargin,
      method: shippingMode === "manual" ? "手動入力" : result?.method ?? "",
      sellingPriceJPY, rate: rate!,
    });
  }, [sellingPrice, costPrice, rate, selectedShippingJPY, shippingMode, result?.method]);

  const stateTaxRate = 0.0671;
  const sellingPriceNum = sellingPrice !== "" ? parseFloat(sellingPrice) : 0;
  const sellingPriceInclTax = sellingPriceNum + sellingPriceNum * stateTaxRate;
  const costPriceNum = typeof costPrice === "number" ? costPrice : 0;

  const final = calcResult ? calculateFinalProfitDetailUS({
    sellingPrice: sellingPriceNum,
    shippingJPY: calcResult.shippingJPY,
    costPrice: costPriceNum,
    categoryFeePercent: 0,
    paymentFeePercent: 1.35,
    exchangeRateUSDtoJPY: rate ?? 0,
    targetMargin: 0.3,
  }) : null;

  const beUSD = useMemo(() => {
    if (!be) return null;
    if (mode === "breakEven") return be.breakEvenUSD;
    if (mode === "tariff") return be.dutyTotalUSD;
    return be.insuranceTotalUSD;
  }, [be, mode]);

  const beJPY = useMemo(() => {
    if (beUSD == null || rate == null) return null;
    return Math.round(beUSD * rate);
  }, [beUSD, rate]);

return (
  <div className="py-4">
    {/* タイトル（全幅） */}
    <div className="mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
        海外発送 利益計算ツール
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        仕入れ値・配送料・為替レートから損益分岐/関税/保険を自動計算します
      </p>
    </div>

    {/* 本体レイアウト：モバイル1列 / md以上2列（1:1） */}
    {/* ✅ 縦方向の余白は grid の gap-y に集約（space-y は使わない） */}
    <div className="grid grid-cols-1  gap-x-8 md:grid-cols-2">
      {/* 左列 */}
      <div className="min-w-0 flex-1 flex-col space-y-4">
        <ExchangeRate onRateChange={setRate} />

        <div>
          <label className="block font-semibold mb-1">仕入れ値 (円)</label>
          <input
            type="number" step="10" min="10" value={costPrice}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") { setCostPrice(""); return; }
              let num = Number(raw); if (num < 0) num = 0;
              setCostPrice(num);
            }}
            placeholder="仕入れ値"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        {/* 配送料モード */}
        <div className="flex items-center justify-between">
          <span className="block font-semibold">配送料モード</span>
          <button
            type="button" role="switch" aria-checked={shippingMode === "manual"}
            onClick={() => setShippingMode(m => (m === "auto" ? "manual" : "auto"))}
            className="relative inline-flex items-center h-9 w-36 rounded-full bg-gray-200 transition"
          >
            <motion.span
              layout className="absolute h-7 w-7 rounded-full bg-white shadow"
              style={{ left: 4, top: 4 }}
              animate={{ x: shippingMode === "manual" ? 96 : 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
            />
            <span className={`w-1/2 text-center text-sm transition ${shippingMode === "auto" ? "font-semibold text-gray-900" : "text-gray-500"}`}>自動</span>
            <span className={`w-1/2 text-center text-sm transition ${shippingMode === "manual" ? "font-semibold text-gray-900" : "text-gray-500"}`}>手動</span>
          </button>
        </div>

        {/* 自動/手動フォーム */}
        <div className="mt-2 rounded-lg p-3 min-h-[240px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={shippingMode}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              {shippingMode === "auto" ? (
                <fieldset>
                  <div className="mt-3">
                    <label className="block font-semibold mb-1">実重量 (g)</label>
                    <input
                      type="number" value={weight ?? ""}
                      onChange={(e) => setWeight(e.target.value === "" ? null : Number(e.target.value))}
                      placeholder="実重量" className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block font-semibold mb-1">サイズ (cm)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number" value={dimensions.length || ""}
                        onChange={(e) => {
                          const raw = e.target.value; if (raw === "") { setDimensions(p => ({ ...p, length: 0 })); return; }
                          const num = Math.max(0, Number(raw)); setDimensions(p => ({ ...p, length: num }));
                        }}
                        placeholder="長さ" className="px-2 py-1 border rounded-md"
                      />
                      <input
                        type="number" value={dimensions.width || ""}
                        onChange={(e) => {
                          const raw = e.target.value; if (raw === "") { setDimensions(p => ({ ...p, width: 0 })); return; }
                          const num = Math.max(0, Number(raw)); setDimensions(p => ({ ...p, width: num }));
                        }}
                        placeholder="幅" className="px-2 py-1 border rounded-md"
                      />
                      <input
                        type="number" value={dimensions.height || ""}
                        onChange={(e) => {
                          const raw = e.target.value; if (raw === "") { setDimensions(p => ({ ...p, height: 0 })); return; }
                          const num = Math.max(0, Number(raw)); setDimensions(p => ({ ...p, height: num }));
                        }}
                        placeholder="高さ" className="px-2 py-1 border rounded-md"
                      />
                    </div>
                  </div>
                </fieldset>
              ) : (
                <div className="mt-3">
                  <label className="block font-semibold mb-1">配送料（円・手動）</label>
                  <input
                    type="number" inputMode="numeric" min={0} step={10}
                    value={manualShipping}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") { setManualShipping(""); return; }
                      const num = Math.max(0, Number(raw));
                      setManualShipping(Number.isFinite(num) ? num : "");
                    }}
                    placeholder="例: 1200" className="w-full px-3 py-2 border rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">※ 手動入力時は重量/サイズは非表示になります</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 右列 */}
      <div className="min-w-0 flex-1 flex-col space-y-4">
        {/* 表示モード */}
        <div className="grid grid-cols-[auto,1fr] items-center gap-3 w-full">
          <span className="font-semibold text-gray-600 whitespace-nowrap">表示モード</span>
          <ModeSwitch mode={mode} onChange={setMode} />
        </div>

        {/* 見出し + 数値 */}
        {hydrated && beUSD != null ? (
          <div className="rounded-xl border border-gray-200/70 bg-white/60 dark:bg-zinc-900/60 dark:border-zinc-800 p-3">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                {mode === "breakEven" ? "損益分岐(USD)" : mode === "tariff" ? "関税込合計(USD)" : "保険込み合計(USD)"}:
              </span>
              <div className="flex items-baseline gap-3 whitespace-nowrap">
                <span className="tabular-nums text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100">
                  {beUSD.toFixed(2)}
                </span>
                {rate != null && beJPY != null && (
                  <span className="tabular-nums text-sm sm:text-base text-gray-600">
                    （約 {beJPY.toLocaleString()} 円)
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-500">必要な入力を埋めると自動計算されます</span>
        )}

        {/* 配送結果 */}
        <div className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[56px] flex flex-wrap items-center gap-x-6 gap-y-1">
          <div className="flex items-center gap-2 min-w-0">
            <p className="whitespace-nowrap">配送方法:</p>
            <p className="truncate">{result === null ? "計算中..." : result.method}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="whitespace-nowrap">配送料:</p>
            <p className="whitespace-nowrap">
              {result === null ? "計算中..." : (result.price != null ? `${result.price}円` : "不明")}
            </p>
          </div>
        </div>

        {/* 利益結果 */}
        {rate !== null && sellingPrice !== "" && (
          <Result
            originalPriceUSD={sellingPrice !== "" ? parseFloat(sellingPrice) : 0}
            priceJPY={sellingPrice !== "" && rate !== null ? Math.round(parseFloat(sellingPrice) * rate) : 0}
            sellingPriceInclTax={sellingPriceInclTax}
            exchangeRateUSDtoJPY={rate ?? 0}
            calcResult={calcResult}
          />
        )}

        {isModalOpen && final && (
          <FinalResultModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            shippingMethod={result?.method || ""}
            shippingJPY={calcResult?.shippingJPY || 0}
            data={final}
            exchangeRateUSDtoJPY={rate ?? 0}
          />
        )}
      </div>
    </div>

    <ChatIcon />
  </div>
)};
