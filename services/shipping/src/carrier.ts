import { randomUUID } from "node:crypto";

export type CreateShipmentInput = {
  carrier: string;
  service: string;
  shipCity: string;
  shipRegion: string;
};

export type CreateShipmentResult = {
  trackingNumber: string;
  status: "in_transit";
  estimatedDeliveryDays: number;
  initialScan: {
    status: string;
    location: string;
    message: string;
  };
};

export type CarrierClient = {
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
};

/** Deterministic FedEx-shaped mock used for local/CI (no external keys). */
export class MockFedExClient implements CarrierClient {
  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    const prefix =
      input.carrier === "UPS"
        ? "1Z"
        : input.carrier === "USPS"
          ? "9400"
          : input.carrier === "FedEx"
            ? "FX"
            : "DL";
    const trackingNumber = `${prefix}${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
    return {
      trackingNumber,
      status: "in_transit",
      estimatedDeliveryDays: input.service === "Express" ? 1 : 3,
      initialScan: {
        status: "in_transit",
        location: "Austin, TX",
        message: `Picked up by ${input.carrier}`,
      },
    };
  }
}
