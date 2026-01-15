export interface CommitteeItem {
  id: number;
  committeeName: string;
  committeeAmount: number;
  commissionMaxMember: number;
  committeeStatus: number;
  noOfMonths: number;
  createdAt: string;
  fineAmount: number;
  extraDaysForFine: number;
  startCommitteeDate: string;
  committeeType?: string; // Optional field for committee type
  lotteryAmount?: number;
}

export interface CommitteeListResponse {
  data: CommitteeItem[];
  message: string;
  success: boolean;
  code: string;
}

export interface CommitteeAnalysisMetrics {
  totalMembers: number;
  totalCommitteeAmount: number;
  totalCommitteePaidAmount: number;
  totalCommitteeFineAmount: number;
  noOfDrawsCompleted: number;
  totalDraws: number;
}

export interface CommitteeAnalysisItem {
  committeeId: number;
  committeeName: string;
  committeeAmount: number;
  commissionMaxMember: number;
  committeeStatus: number;
  noOfMonths: number;
  fineAmount: number;
  extraDaysForFine: number;
  startCommitteeDate: string;
  committeeType?: string; // Committee type (LOTTERY or NORMAL)
  analysis: CommitteeAnalysisMetrics;
}

export interface CommitteeAnalysisResponse {
  data: CommitteeAnalysisItem;
  message: string;
  success: boolean;
  code: string;
}

export interface CommitteeMemberUser {
  name?: string | null;
  email?: string | null;
  phoneNo?: string | null;
  isUserDrawCompleted?: boolean; // Indicates if user draw is completed
}

export interface CommitteeMemberItem {
  id?: number;
  name?: string | null;
  memberName?: string | null;
  userName?: string | null;
  email?: string | null;
  phoneNo?: string | null;
  phoneNumber?: string | null;
  user?: CommitteeMemberUser;
  isUserDrawCompleted?: boolean; // Indicates if user draw is completed
}

export interface CommitteeMemberListResponse {
  data: CommitteeMemberItem[];
  message: string;
  success: boolean;
  code: string;
}

export interface CommitteeDrawItem {
  id: number;
  committeeId: number;
  committeeDrawAmount: number;
  committeeDrawPaidAmount: number;
  committeeDrawMinAmount: number;
  committeeDrawDate: string;
  committeeDrawTime: string;
  isDrawCompleted?: boolean; // Indicates if draw is completed
}

export interface CommitteeDrawListResponse {
  data: CommitteeDrawItem[];
  message?: string;
  success?: boolean;
  code?: string;
}

export interface DrawUserWisePaidUser {
  id: number;
  name: string;
  phoneNo: string;
  email: string;
  role: string;
  userDrawAmountPaid: number;
  fineAmountPaid: number;
}

export interface DrawUserWisePaidItem {
  id: number;
  committeeId: number;
  drawId: number;
  userId: number;
  user: DrawUserWisePaidUser;
  createdAt: string;
  updatedAt: string;
}

export interface DrawUserWisePaidResponse {
  data: DrawUserWisePaidItem[];
  message?: string;
  success?: boolean;
  code?: string;
}


