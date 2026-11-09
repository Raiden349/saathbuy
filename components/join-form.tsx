"use client";

import { useState } from "react";
import { joinDealAction } from "@/app/actions/deals";

type JoinFormProps = {
  slug: string;
  maxQuantity: number;
  pointsBalance: number;
  freeFeeCredits: number;
  currentPrice: number;
  issue?: string;
};

const issueCopy: Record<string, string> = {
  invalid: "Check the join details and try again.",
  ended: "This deal ended. Pick another open deal.",
  quantity: "The pack quantity is above this deal's limit.",
  points: "Your points balance changed. Check it and try again.",
  wallet: "Enter the transaction ID from your JazzCash or Easypaisa receipt.",
  already: "You already joined this deal.",
  failed: "Your spot could not be saved. Try again.",
};

export function JoinForm({ slug, maxQuantity, pointsBalance, freeFeeCredits, currentPrice, issue }: JoinFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [usePoints, setUsePoints] = useState(false);
  const [points, setPoints] = useState(0);
  const [method, setMethod] = useState<"cash_at_pickup" | "wallet">("cash_at_pickup");
  const availablePoints = Math.floor(pointsBalance / 100) * 100;
  const redeemedPoints = usePoints ? Math.min(points, availablePoints) : 0;
  const serviceFee = freeFeeCredits > 0 ? 0 : 20;
  const subtotal = currentPrice * quantity;
  const pointsDiscount = (redeemedPoints / 100) * 50;
  const total = Math.max(0, subtotal - pointsDiscount) + serviceFee;

  return (
    <form action={joinDealAction} className="join-form">
      <input name="deal_slug" type="hidden" value={slug} />
      {issue && <p className="auth-message auth-error" role="alert">{issueCopy[issue] ?? issueCopy.failed}</p>}
      <section className="join-section">
        <h2 className="section-title">Quantity</h2>
        <div className="quantity-row">
          <span>Packs</span>
          <div className="quantity-control">
            <button aria-label="Decrease quantity" className="quantity-step" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} type="button">−</button>
            <output aria-live="polite" className="quantity-value">{quantity}</output>
            <button aria-label="Increase quantity" className="quantity-step" disabled={quantity >= maxQuantity} onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} type="button">+</button>
          </div>
        </div>
        <p className="form-help">Up to {maxQuantity} packs on this deal.</p>
      </section>

      <section className="join-section">
        <h2 className="section-title">SaathBuy points</h2>
        <label className="points-toggle">
          <input checked={usePoints} disabled={availablePoints < 100} onChange={(event) => setUsePoints(event.target.checked)} type="checkbox" />
          <span>Use points</span>
          <span className="points-balance">{pointsBalance} available</span>
        </label>
        {usePoints && <label className="form-field points-field"><span>Redeem points, in blocks of 100</span>
          <input className="form-input" max={availablePoints} min={0} name="points_redeemed" onChange={(event) => setPoints(Math.floor(Number(event.target.value || 0) / 100) * 100)} step={100} type="number" value={points} />
          <span className="form-help">100 points = Rs. 50 off</span>
        </label>}
        {!usePoints && <input name="points_redeemed" type="hidden" value="0" />}
      </section>

      <section className="join-section">
        <h2 className="section-title">Payment method</h2>
        <label className={`payment-option${method === "cash_at_pickup" ? " payment-option-selected" : ""}`}>
          <input checked={method === "cash_at_pickup"} name="payment_method" onChange={() => setMethod("cash_at_pickup")} type="radio" value="cash_at_pickup" />
          <span>Cash at pickup</span>
        </label>
        <label className={`payment-option${method === "wallet" ? " payment-option-selected" : ""}`}>
          <input checked={method === "wallet"} name="payment_method" onChange={() => setMethod("wallet")} type="radio" value="wallet" />
          <span>Wallet (JazzCash or Easypaisa)</span>
        </label>
        {method === "wallet" && <label className="form-field wallet-field"><span>Transaction ID</span>
          <input autoComplete="off" className="form-input" maxLength={120} name="wallet_reference" required />
        </label>}
      </section>

      <section aria-label="Estimated order total" className="receipt-summary">
        <div><span>Subtotal</span><span>Rs. {subtotal}</span></div>
        {redeemedPoints > 0 && <div><span>Points</span><span>− Rs. {pointsDiscount}</span></div>}
        <div><span>Service fee</span><span>{serviceFee ? `Rs. ${serviceFee}` : "Free"}</span></div>
        <div className="receipt-total"><span>Estimated total</span><span>Rs. {total}</span></div>
      </section>
      <p className="join-price-note">You pay the best price reached at the deadline.</p>
      <button className="button-primary join-confirm" type="submit">Confirm and join</button>
    </form>
  );
}
