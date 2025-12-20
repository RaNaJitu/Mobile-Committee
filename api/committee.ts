import type {
  CommitteeAnalysisResponse,
  CommitteeDrawListResponse,
  CommitteeListResponse,
  CommitteeMemberListResponse,
  DrawUserWisePaidResponse,
} from "@/types/committee";

import { API_BASE_URL } from "@/config/env";

const BASE_URL = API_BASE_URL;
const COMMITTEE_LIST_PATH = "/committee/get";
const COMMITTEE_ANALYSIS_PATH = "/committee/analysis";
const COMMITTEE_MEMBERS_PATH = "/committee/member/get";
const COMMITTEE_DRAWS_PATH = "/committee/draw/get";
const COMMITTEE_DRAW_USER_WISE_PAID_PATH = "/committee/draw/user-wise-paid";

export async function fetchCommitteeList(
  token: string,
): Promise<CommitteeListResponse> {
  const response = await fetch(`${BASE_URL}${COMMITTEE_LIST_PATH}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response
    .json()
    .catch(() => null) as CommitteeListResponse | { message?: string; error?: string };

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && ("message" in data || "error" in data)
        ? (data as any).message ?? (data as any).error
        : undefined) ?? `Committee list failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as CommitteeListResponse;
}

export async function fetchCommitteeAnalysis(
  token: string,
  committeeId: number,
): Promise<CommitteeAnalysisResponse> {
  const url = `${BASE_URL}${COMMITTEE_ANALYSIS_PATH}?committeeId=${encodeURIComponent(
    committeeId,
  )}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response
    .json()
    .catch(
      () =>
        null,
    ) as CommitteeAnalysisResponse | { message?: string; error?: string };

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && ("message" in data || "error" in data)
        ? (data as any).message ?? (data as any).error
        : undefined) ?? `Committee analysis failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as CommitteeAnalysisResponse;
}

export async function fetchCommitteeMembers(
  token: string,
  committeeId: number,
): Promise<CommitteeMemberListResponse> {
  const url = `${BASE_URL}${COMMITTEE_MEMBERS_PATH}?committeeId=${encodeURIComponent(
    committeeId,
  )}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response
    .json()
    .catch(
      () =>
        null,
    ) as CommitteeMemberListResponse | { message?: string; error?: string };

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && ("message" in data || "error" in data)
        ? (data as any).message ?? (data as any).error
        : undefined) ?? `Committee member list failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as CommitteeMemberListResponse;
}

export async function fetchCommitteeDraws(
  token: string,
  committeeId: number,
): Promise<CommitteeDrawListResponse> {
  const url = `${BASE_URL}${COMMITTEE_DRAWS_PATH}?committeeId=${encodeURIComponent(
    committeeId,
  )}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "*/*",
      "Content-Type": "application/json",
    },
  });

  const data = await response
    .json()
    .catch(
      () =>
        null,
    ) as CommitteeDrawListResponse | { message?: string; error?: string };

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && ("message" in data || "error" in data)
        ? (data as any).message ?? (data as any).error
        : undefined) ?? `Committee draws failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as CommitteeDrawListResponse;
}

export async function fetchDrawUserWisePaid(
  token: string,
  committeeId: number,
  drawId: number,
): Promise<DrawUserWisePaidResponse> {
  const url = `${BASE_URL}${COMMITTEE_DRAW_USER_WISE_PAID_PATH}?committeeId=${encodeURIComponent(
    committeeId,
  )}&drawId=${encodeURIComponent(drawId)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "*/*",
      "Content-Type": "application/json",
    },
  });

  const data = await response
    .json()
    .catch(
      () =>
        null,
    ) as DrawUserWisePaidResponse | { message?: string; error?: string };

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && ("message" in data || "error" in data)
        ? (data as any).message ?? (data as any).error
        : undefined) ?? `Draw user-wise paid failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as DrawUserWisePaidResponse;
}

export async function updateDrawUserWisePaid(
  token: string,
  committeeId: number,
  userId: number,
  drawId: number,
  userDrawAmountPaid: number,
): Promise<{ success: boolean; message?: string }> {
  const url = `${BASE_URL}${COMMITTEE_DRAW_USER_WISE_PAID_PATH}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "*/*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      committeeId,
      userId,
      drawId,
      userDrawAmountPaid,
    }),
  });

  const data = await response
    .json()
    .catch(
      () =>
        null,
    ) as { success?: boolean; message?: string; error?: string } | null;

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && ("message" in data || "error" in data)
        ? (data as any).message ?? (data as any).error
        : undefined) ?? `Update draw user-wise paid failed with status ${response.status}`;

    throw new Error(message);
  }

  return {
    success: data?.success ?? true,
    message: data?.message,
  };
}

