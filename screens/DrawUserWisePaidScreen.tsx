import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    ListRenderItem,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchDrawUserWisePaid, updateDrawUserWisePaid } from "@/api/committee";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import type { DrawUserWisePaidItem } from "@/types/committee";
import { isSessionExpiredError } from "@/utils/apiErrorHandler";
import { logger } from "@/utils/logger";

const DrawUserWisePaidScreen = (): React.JSX.Element => {
  const { token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    drawId?: string;
  }>();

  const committeeId = Number(params.id);
  const drawId = Number(params.drawId);

  const [items, setItems] = useState<DrawUserWisePaidItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const loadData = async () => {
    if (!token || Number.isNaN(committeeId) || Number.isNaN(drawId)) {
      setError("Missing draw context. Please reopen from the list.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetchDrawUserWisePaid(token, committeeId, drawId);
      setItems(response.data ?? []);
    } catch (err) {
      // Don't show error if session expired (redirect is already happening)
      if (isSessionExpiredError(err)) {
        return;
      }
      
      logger.error("Failed to load draw user-wise paid", err);
      const errorMessage = err instanceof Error ? err.message : "Unable to load draw user-wise paid data.";
      
      // Handle specific error cases
      if (errorMessage.toLowerCase().includes("not started")) {
        setError("This draw has not been started yet. Payment records will be available once the draw begins.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, committeeId, drawId]);

  const handleBack = () => {
    router.back();
  };

  const handleMakePaid = async (item: DrawUserWisePaidItem) => {
    if (!token || updatingUserId === item.userId) {
      return;
    }

    try {
      setUpdatingUserId(item.userId);
      await updateDrawUserWisePaid(
        token,
        item.committeeId,
        item.userId,
        item.drawId,
        item.user.userDrawAmountPaid,
      );
      
      // Reload the data to show updated values
      await loadData();
    } catch (err) {
      // Don't show error if session expired (redirect is already happening)
      if (isSessionExpiredError(err)) {
        return;
      }
      
      logger.error("Failed to update payment", err);
      const errorMessage = err instanceof Error ? err.message : "Unable to update payment.";
      setError(errorMessage);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const renderItem: ListRenderItem<DrawUserWisePaidItem> = ({ item }) => {
    const user = item.user;
    const formattedDrawAmount = Number(user.userDrawAmountPaid);
    const formattedFineAmount = Number(user.fineAmountPaid);
    const formattedTotalAmount = Number(Number(user.userDrawAmountPaid) + Number(user.fineAmountPaid)) ?? 0
    return (
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userInfo}>
            {user.email} • {user.phoneNo}
          </Text>
          <View style={styles.amountRow}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Draw Amount Paid:</Text>
              <Text style={styles.amountValue}>₹{formattedDrawAmount}</Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Fine Amount Paid:</Text>
              <Text style={styles.amountValue}>₹{formattedFineAmount}</Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Total Amount Paid:</Text>
              <Text style={styles.amountValue}>₹{formattedTotalAmount}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.timerPill,
                updatingUserId === item.userId && styles.timerPillDisabled,
              ]}
              onPress={() => handleMakePaid(item)}
              disabled={updatingUserId === item.userId}
              activeOpacity={0.7}
            >
              {updatingUserId === item.userId ? (
                <ActivityIndicator size="small" color="#FFD700" />
              ) : (
                <Text
                  style={[
                    styles.statusText,
                    {color: "#FFD700"},
                  ]}
                >
                  {"Make Paid"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View >

        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        {/* <TouchableOpacity onPress={handleBack} hitSlop={10}>
          <Text style={styles.backText}>◀ Back</Text>
        </TouchableOpacity> */}
        <Text style={styles.headerTitle}>Draw #{drawId} - Payments</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.container}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading payments...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && (
          <FlatList
            data={items}
            keyExtractor={(item, index) => `${item.id}-${item.userId}-${index}`}
            renderItem={renderItem}
            contentContainerStyle={
              items.length === 0 ? styles.emptyContainer : styles.listContent
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No payment records found for this draw.
              </Text>
            }
          />
        )}
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
  listContent: {
    paddingBottom: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inputBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardContent: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  amountRow: {
    gap: 8,
  },
  amountItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  amountValue: {
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
  emptyContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
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
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  timerPillDisabled: {
    opacity: 0.6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
});

export default DrawUserWisePaidScreen;

