import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fetchCommitteeAnalysis,
  fetchCommitteeDraws,
  fetchCommitteeMembers,
} from "@/api/committee";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import type {
  CommitteeAnalysisItem,
  CommitteeDrawItem,
  CommitteeMemberItem,
} from "@/types/committee";

type DetailTab = "members" | "analysis" | "draws";

const CommitteeAnalysisScreen = (): React.JSX.Element => {
  const { token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    amount?: string;
    maxMembers?: string;
    status?: string;
    startDate?: string;
  }>();

  const committeeId = Number(params.id);

  const [activeTab, setActiveTab] = useState<DetailTab>("draws");

  const [members, setMembers] = useState<CommitteeMemberItem[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<CommitteeAnalysisItem | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisLoadedOnce, setAnalysisLoadedOnce] = useState(false);

  const [draws, setDraws] = useState<CommitteeDrawItem[]>([]);
  const [drawsLoading, setDrawsLoading] = useState(false);
  const [drawsError, setDrawsError] = useState<string | null>(null);
  const [drawsLoadedOnce, setDrawsLoadedOnce] = useState(false);

  useEffect(() => {
    const loadMembers = async () => {
      if (!token || Number.isNaN(committeeId)) {
        setMembersError("Missing committee context. Please reopen from the list.");
        return;
      }

      try {
        setMembersLoading(true);
        setMembersError(null);
        const response = await fetchCommitteeMembers(token, committeeId);
        // console.log("==LOG== ~ loadMembers ~ response:", response)
        setMembers(response.data ?? []);
      } catch (err) {
        console.error("Failed to load committee members", err);
        setMembersError(
          err instanceof Error
            ? err.message
            : "Unable to load committee members.",
        );
      } finally {
        setMembersLoading(false);
      }
    };

    void loadMembers();
  }, [token, committeeId]);

  useEffect(() => {
    const loadAnalysis = async () => {
      if (analysisLoadedOnce || activeTab !== "analysis") {
        return;
      }

      if (!token || Number.isNaN(committeeId)) {
        setAnalysisError("Missing committee context. Please reopen from the list.");
        return;
      }

      try {
        setAnalysisLoading(true);
        setAnalysisError(null);
        const response = await fetchCommitteeAnalysis(token, committeeId);
        setAnalysis(response.data);
        setAnalysisLoadedOnce(true);
      } catch (err) {
        console.error("Failed to load committee analysis", err);
        setAnalysisError(
          err instanceof Error
            ? err.message
            : "Unable to load committee analysis.",
        );
      } finally {
        setAnalysisLoading(false);
      }
    };

    void loadAnalysis();
  }, [activeTab, token, committeeId, analysisLoadedOnce]);

  useEffect(() => {
    const loadDraws = async () => {
      if (drawsLoadedOnce || activeTab !== "draws") {
        return;
      }

      if (!token || Number.isNaN(committeeId)) {
        setDrawsError("Missing committee context. Please reopen from the list.");
        return;
      }

      try {
        setDrawsLoading(true);
        setDrawsError(null);
        const response = await fetchCommitteeDraws(token, committeeId);
        setDraws(response.data ?? []);
        setDrawsLoadedOnce(true);
      } catch (err) {
        console.error("Failed to load committee draws", err);
        setDrawsError(
          err instanceof Error
            ? err.message
            : "Unable to load committee draws.",
        );
      } finally {
        setDrawsLoading(false);
      }
    };

    void loadDraws();
  }, [activeTab, token, committeeId, drawsLoadedOnce]);

  const handleBack = () => {
    router.back();
  };

  const baseName =
    params.name ?? analysis?.committeeName ?? "Committee details";
  const baseAmount =
    params.amount !== undefined
      ? Number(params.amount)
      : analysis?.committeeAmount;
  const baseMaxMembers =
    params.maxMembers !== undefined
      ? Number(params.maxMembers)
      : analysis?.commissionMaxMember;
  const baseStatus =
    params.status !== undefined
      ? Number(params.status)
      : analysis?.committeeStatus;
  const baseStartDateString = params.startDate ?? analysis?.startCommitteeDate;

  const isActive = baseStatus === 1;
  const formattedAmount =
    typeof baseAmount === "number" ? baseAmount.toLocaleString() : "-";
  const startDate = baseStartDateString
    ? new Date(baseStartDateString)
    : null;
  const startDateLabel =
    startDate && !Number.isNaN(startDate.getTime())
      ? startDate.toLocaleDateString()
      : "-";

  const renderMembers = () => {
    if (membersLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      );
    }

    if (membersError) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{membersError}</Text>
        </View>
      );
    }

    if (members.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No members found for this committee.</Text>
        </View>
      );
    }

    const renderMember: ListRenderItem<CommitteeMemberItem> = ({ item }) => {
      // console.log("==LOG== ~ renderMember ~ item:", item.user)
      const displayName =
        item.user?.name ?? item.name ?? item.memberName ?? item.userName ?? "Member";
      const email = item.user?.email ?? item.email ?? "";
      const phone =
        item.user?.phoneNo ?? item.phoneNo ?? item.phoneNumber ?? "";

      const secondary =
        // email && phone ? `${email} • ${phone}` : email || phone || "";
        email && phone ? `• ${email}` : email || phone || "";

      return (
        <View style={styles.memberCard}>
          <View style={styles.memberAvatar}>
            <Text style={styles.memberAvatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.memberContent}>
            <Text style={styles.memberName}>{`${displayName} (${phone})`}</Text>
            {/* <Text style={styles.drawValue}>{phone}</Text> */}
            {/* <Text style={styles.memberName}>{phone}</Text> */}
            {secondary ? (
              <Text style={styles.memberSecondary}>{secondary}</Text>
            ) : null}
          </View>
        </View>
      );
    };

    return (
      <FlatList
        data={members}
        keyExtractor={(_, index) => String(index)}
        renderItem={renderMember}
        contentContainerStyle={styles.membersListContent}
      />
    );
  };

  const renderAnalysis = () => {
    if (analysisLoading && !analysisLoadedOnce) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading analysis...</Text>
        </View>
      );
    }

    if (analysisError) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{analysisError}</Text>
        </View>
      );
    }

    if (!analysis) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            No analysis available for this committee.
          </Text>
        </View>
      );
    }

    const metrics = analysis.analysis;

    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.analysisCard}>
          <Text style={styles.sectionTitle}>Analysis</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total members</Text>
              <Text style={styles.metricValue}>
                {metrics.totalMembers ?? "-"}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total amount</Text>
              <Text style={styles.metricValue}>
                ₹{metrics.totalCommitteeAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Paid amount</Text>
              <Text style={styles.metricValue}>
                ₹{metrics.totalCommitteePaidAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Fine amount</Text>
              <Text style={styles.metricValue}>
                ₹{metrics.totalCommitteeFineAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Draws completed</Text>
              <Text style={styles.metricValue}>
                {metrics.noOfDrawsCompleted} / {metrics.totalDraws}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderDraws = () => {
    if (drawsLoading && !drawsLoadedOnce) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading draws...</Text>
        </View>
      );
    }

    if (drawsError) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{drawsError}</Text>
        </View>
      );
    }

    if (draws.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No draws found for this committee.</Text>
        </View>
      );
    }

    const renderDraw: ListRenderItem<CommitteeDrawItem> = ({ item }) => {
      const drawDate = new Date(item.committeeDrawDate);
      const drawDateLabel = Number.isNaN(drawDate.getTime())
        ? "-"
        : drawDate.toLocaleDateString();
      const drawTime = new Date(item.committeeDrawTime);
      const drawTimeLabel = Number.isNaN(drawTime.getTime())
        ? "-"
        : drawTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const formattedDrawAmount = item.committeeDrawAmount.toLocaleString();
      const formattedPaidAmount = item.committeeDrawPaidAmount.toLocaleString();
      const formattedMinAmount = item.committeeDrawMinAmount.toLocaleString();

      const handleDrawPress = () => {
        console.log("Draw card pressed:", { committeeId, drawId: item.id });
        router.push(
          `/committee/${committeeId}/draw/${item.id}` as any,
        );
      };

      return (
        <TouchableOpacity
          style={styles.drawCard}
          activeOpacity={0.7}
          onPress={handleDrawPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.drawHeader}>
            <Text style={styles.drawTitle}>Draw #{item.id}</Text>
            <Text style={styles.drawDate}>
              {drawDateLabel} {drawTimeLabel}
            </Text>
          </View>
          <View style={styles.drawDetails}>
            <View style={styles.drawDetailRow}>
              <Text style={styles.drawLabel}>Draw amount:</Text>
              {/* <Text style={styles.drawValue}>₹{formattedDrawAmount}</Text> */}
              <Text style={styles.drawValue}>₹ {formattedDrawAmount}</Text>
            </View>
            <View style={styles.drawDetailRow}>
              <Text style={styles.drawLabel}>Max amount:</Text>
              <Text style={styles.drawValue}>₹ {formattedMinAmount}</Text>
              <View
              style={[
                styles.timerPill,
              ]}
            >
                <Text
                  style={[
                    styles.statusText,
                    {color: "#FFD700"},
                  ]}
                >
                  {"Timer"}
                </Text>
            </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    };

    return (
      <FlatList
        data={draws}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderDraw}
        contentContainerStyle={styles.drawsListContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        {/* <TouchableOpacity onPress={handleBack} hitSlop={10}>
          <Text style={styles.backText}>◀ Back</Text>
        </TouchableOpacity> */}
        <Text style={styles.headerTitle}>Committee details</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {baseName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerTextWrapper}>
              <Text style={styles.title}>{baseName}</Text>
              {/* <Text style={styles.subtitle}>
                Amount: ₹{formattedAmount}{" "}
                {baseMaxMembers
                  ? `• Max members: ${baseMaxMembers}`
                  : ""}
              </Text> */}
              <Text style={styles.subtitle}>Amount: {formattedAmount}</Text>
              <Text style={styles.subtitle}>Max Members: {baseMaxMembers}</Text>
              <Text style={styles.subtitle}>Start: {startDateLabel}</Text>
            </View>
            <View
              style={[
                styles.statusPill,
                isActive ? styles.statusActive : styles.statusInactive,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isActive ? styles.statusTextActive : styles.statusTextInactive,
                ]}
              >
                {isActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tabBar}>
        <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "draws" && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab("draws")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "draws" && styles.tabTextActive,
              ]}
            >
              Committee Draw
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "members" && styles.tabItemActive,
            ]}
            
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "members" && styles.tabTextActive,
              ]}
              onPress={() => setActiveTab("members")}
            >
              Members
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "analysis" && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab("analysis")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "analysis" && styles.tabTextActive,
              ]}
            >
              Analysis
            </Text>
          </TouchableOpacity>
          
        </View>

        <View style={styles.body}>
          {activeTab === "members"
            ? renderMembers()
            : activeTab === "analysis"
              ? renderAnalysis()
              : renderDraws()}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backText: {
    color: colors.primary,
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.inputBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headerTextWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 8,
  },
  statusActive: {
    borderColor: "#22c55e",
    backgroundColor: "rgba(34,197,94,0.12)",
  },
  statusInactive: {
    borderColor: "#6b7280",
    backgroundColor: "rgba(107,114,128,0.15)",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusTextActive: {
    color: "#22c55e",
  },
  statusTextInactive: {
    color: "#9ca3af",
  },
  analysisCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 18,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  metricItem: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 13,
    color: "#f87171",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    borderRadius: 999,
    padding: 4,
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: "#1B1235",
  },
  membersListContent: {
    paddingBottom: 12,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inputBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  memberContent: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  memberSecondary: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  drawsListContent: {
    paddingBottom: 12,
  },
  drawCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  drawHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  drawTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  drawDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  drawDetails: {
    gap: 6,
  },
  drawDetailRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  drawLabel: {
    fontSize: 13,
    marginRight: 10,
    color: colors.textSecondary,
  },
  drawValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  timerPill: {
      borderColor: "#FFD700",
      backgroundColor: "rgba(224, 203, 15, 0.12)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      marginLeft: "auto",
      alignSelf: "flex-start",
    },
});

export default CommitteeAnalysisScreen;


