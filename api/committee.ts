import type {
    CommitteeAnalysisResponse,
    CommitteeDrawListResponse,
    CommitteeListResponse,
    CommitteeMemberListResponse,
    DrawUserWisePaidResponse,
} from "@/types/committee";

import { apiClient } from "@/utils/apiClient";

const COMMITTEE_LIST_PATH = "/committee/get";
const COMMITTEE_ANALYSIS_PATH = "/committee/analysis";
const COMMITTEE_MEMBERS_PATH = "/committee/member/get";
const COMMITTEE_DRAWS_PATH = "/draw/get";
const COMMITTEE_DRAW_USER_WISE_PAID_PATH = "/draw/user-wise-paid";

export async function fetchCommitteeList(
  token: string,
): Promise<CommitteeListResponse> {
  return apiClient.get<CommitteeListResponse>(COMMITTEE_LIST_PATH, token);
}

export async function fetchCommitteeAnalysis(
  token: string,
  committeeId: number,
): Promise<CommitteeAnalysisResponse> {
  const url = `${COMMITTEE_ANALYSIS_PATH}?committeeId=${encodeURIComponent(
    committeeId,
  )}`;
  return apiClient.get<CommitteeAnalysisResponse>(url, token);
}

export async function fetchCommitteeMembers(
  token: string,
  committeeId: number,
): Promise<CommitteeMemberListResponse> {
  const url = `${COMMITTEE_MEMBERS_PATH}?committeeId=${encodeURIComponent(
    committeeId,
  )}`;
  return apiClient.get<CommitteeMemberListResponse>(url, token);
}

export async function fetchCommitteeDraws(
  token: string,
  committeeId: number,
): Promise<CommitteeDrawListResponse> {
  const url = `${COMMITTEE_DRAWS_PATH}?committeeId=${encodeURIComponent(
    committeeId,
  )}`;
  return apiClient.get<CommitteeDrawListResponse>(url, token);
}

export async function fetchDrawUserWisePaid(
  token: string,
  committeeId: number,
  drawId: number,
): Promise<DrawUserWisePaidResponse> {
  const url = `${COMMITTEE_DRAW_USER_WISE_PAID_PATH}?committeeId=${encodeURIComponent(
    committeeId,
  )}&drawId=${encodeURIComponent(drawId)}`;
  return apiClient.get<DrawUserWisePaidResponse>(url, token);
}

export async function updateDrawUserWisePaid(
  token: string,
  committeeId: number,
  userId: number,
  drawId: number,
  userDrawAmountPaid: number,
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.patch<{ success?: boolean; message?: string }>(
    COMMITTEE_DRAW_USER_WISE_PAID_PATH,
    {
      committeeId,
      userId,
      drawId,
      userDrawAmountPaid,
    },
    token,
  );

  return {
    success: response.success ?? true,
    message: response.message,
  };
}

export async function updateDrawAmount(
  token: string,
  committeeId: number,
  drawId: number,
  amount: number,
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.patch<{ success?: boolean; message?: string }>(
    "/draw/amount-update",
    {
      committeeId,
      drawId,
      amount,
    },
    token,
  );

  return {
    success: response.success ?? true,
    message: response.message,
  };
}
