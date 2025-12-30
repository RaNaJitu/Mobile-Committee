import { useRouter } from "expo-router";
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

import { fetchCommitteeList } from "@/api/committee";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import type { CommitteeItem } from "@/types/committee";
import { logger } from "@/utils/logger";

const CommitteeListScreen = (): React.JSX.Element => {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<CommitteeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading before attempting to fetch data
    if (authLoading) {
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!token) {
          // If no token after auth has loaded, redirect to login
          logger.log("No token found, redirecting to login");
          router.replace("/");
          return;
        }
        const response = await fetchCommitteeList(token);
        setItems(response.data ?? []);
      } catch (err) {
        logger.error("Failed to load committees", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load committee list.",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token, authLoading, router]);

  const renderItem: ListRenderItem<CommitteeItem> = ({ item }) => {
    const isActive = item.committeeStatus === 1;
    const formattedAmount = item.committeeAmount.toLocaleString();
    const startDate = new Date(item.startCommitteeDate);
    const startDateLabel = Number.isNaN(startDate.getTime())
      ? "-"
      : startDate.toLocaleDateString();

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() =>
          router.push({
            pathname: "/committee/[id]",
            params: {
              id: String(item.id),
              name: item.committeeName,
              amount: String(item.committeeAmount),
              maxMembers: String(item.commissionMaxMember),
              status: String(item.committeeStatus),
              startDate: item.startCommitteeDate,
            },
          })
        }
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.committeeName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.title}>{item.committeeName}</Text>
          <Text style={styles.subtitle}>
            Amount: ₹{formattedAmount} • Max members: {item.commissionMaxMember}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Start: {startDateLabel}</Text>
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
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Text style={styles.screenTitle}>Committees</Text>

        {(authLoading || loading) && (
          <View style={styles.center}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>
              {authLoading ? "Loading..." : "Loading committees..."}
            </Text>
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
              <Text style={styles.emptyText}>No committees found.</Text>
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
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
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
  },
});

export default CommitteeListScreen;


