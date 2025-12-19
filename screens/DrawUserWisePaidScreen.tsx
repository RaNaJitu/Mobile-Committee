import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { fetchDrawUserWisePaid } from "@/api/committee";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import type { DrawUserWisePaidItem } from "@/types/committee";

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

  useEffect(() => {
    const load = async () => {
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
        console.error("Failed to load draw user-wise paid", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load draw user-wise paid data.",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token, committeeId, drawId]);

  const handleBack = () => {
    router.back();
  };

  const renderItem: ListRenderItem<DrawUserWisePaidItem> = ({ item }) => {
    const user = item.user;
    const formattedDrawAmount = user.userDrawAmountPaid.toLocaleString();
    const formattedFineAmount = user.fineAmountPaid.toLocaleString();

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
              <Text style={styles.amountLabel}>Draw amount paid:</Text>
              <Text style={styles.amountValue}>₹{formattedDrawAmount}</Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Fine amount paid:</Text>
              <Text style={styles.amountValue}>₹{formattedFineAmount}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} hitSlop={10}>
          <Text style={styles.backText}>◀ Back</Text>
        </TouchableOpacity>
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
            keyExtractor={(item) => String(item.id)}
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
});

export default DrawUserWisePaidScreen;

