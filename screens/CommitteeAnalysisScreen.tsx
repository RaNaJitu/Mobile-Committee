import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  ListRenderItem,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fetchCommitteeAnalysis,
  fetchCommitteeDraws,
  fetchCommitteeMembers,
  fetchLotteryRandomUser,
  updateDrawAmount,
  updateLotteryResult,
} from "@/api/committee";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import type {
  CommitteeAnalysisItem,
  CommitteeDrawItem,
  CommitteeMemberItem,
} from "@/types/committee";
import { isSessionExpiredError } from "@/utils/apiErrorHandler";
import { logger } from "@/utils/logger";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

type DetailTab = "members" | "analysis" | "draws";

// Get screen width for responsive font sizing
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IS_SMALL_SCREEN = SCREEN_WIDTH <= 375; // iPhone 12 mini and smaller

// Animated User Item Component - Memoized for performance
const AnimatedUserItem = React.memo(({ 
  item, 
  index, 
  isSelected,
  isWinnerOnly = false
}: { 
  item: CommitteeMemberItem; 
  index: number;
  isSelected?: boolean;
  isWinnerOnly?: boolean;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Initial entrance animation
  useEffect(() => {
    const entranceAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]);
    
    entranceAnimation.start();
    
    return () => {
      entranceAnimation.stop();
    };
  }, [index, fadeAnim, slideAnim]);

  // Winner highlight animation - more impressive effect
  useEffect(() => {
    let winnerAnimation: Animated.CompositeAnimation | null = null;
    let pulseLoop: Animated.CompositeAnimation | null = null;
    
    if (isSelected) {
      // Reset values first
      scaleAnim.setValue(1);
      rotateAnim.setValue(0);
      
      // Create impressive winner animation sequence
      winnerAnimation = Animated.sequence([
        // Initial dramatic bounce and rotation
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1.2,
            tension: 50,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // Bounce back
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 0.95,
            tension: 40,
            friction: 4,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -0.5,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        // Settle to final position
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1.05,
            tension: 30,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]);
      
      winnerAnimation.start(() => {
        // After initial animation completes, start continuous pulse
        pulseLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.08,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1.02,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          { iterations: -1 }
        );
        pulseLoop.start();
      });
    } else {
      // Reset all animations
      scaleAnim.setValue(1);
      rotateAnim.setValue(0);
    }
    
    return () => {
      // Cleanup animations on unmount or when isSelected changes
      if (winnerAnimation) {
        winnerAnimation.stop();
      }
      if (pulseLoop) {
        pulseLoop.stop();
      }
      scaleAnim.stopAnimation();
      rotateAnim.stopAnimation();
    };
  }, [isSelected, scaleAnim, rotateAnim]);

  const displayName = item.user?.name ?? item.name ?? item.memberName ?? item.userName ?? "Member";
  const phone = item.user?.phoneNo ?? item.phoneNo ?? item.phoneNumber ?? "";

  // Rotation interpolation for subtle shake effect
  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-2deg', '0deg', '2deg'],
  });

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [
      { translateY: slideAnim },
      { scale: scaleAnim },
      { rotate },
    ],
  };

  return (
    <Animated.View
      style={[
        styles.lotteryUserCard,
        isSelected && styles.lotteryUserCardSelected,
        isWinnerOnly && styles.lotteryUserCardWinnerOnly,
        animatedStyle,
        isSelected && {
          // Enhanced shadow for selected winner
          shadowColor: "#22c55e",
          shadowOpacity: 0.8,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 4 },
          elevation: 10,
        },
      ]}
    >
      <View style={[styles.lotteryUserContent, isWinnerOnly && styles.lotteryUserContentWinnerOnly]}>
        <Text style={[
          styles.lotteryUserName, 
          isSelected && styles.lotteryUserNameSelected,
          isWinnerOnly && styles.lotteryUserNameWinnerOnly
        ]}>
          {displayName}
        </Text>
        {phone ? (
          <Text style={[
            styles.lotteryUserPhone, 
            isSelected && styles.lotteryUserPhoneSelected,
            isWinnerOnly && styles.lotteryUserPhoneWinnerOnly
          ]}>
            {phone}
          </Text>
        ) : null}
        {isSelected && (
          <View style={[styles.winnerBadge, isWinnerOnly && styles.winnerBadgeLarge]}>
            <Text style={[styles.winnerBadgeText, isWinnerOnly && styles.winnerBadgeTextLarge]}>
              🏆 WINNER
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render if selection state or winner-only state changes
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isWinnerOnly === nextProps.isWinnerOnly &&
    prevProps.index === nextProps.index
  );
});

// Animated Users List Component
const AnimatedUsersList = ({ 
  members, 
  isVisible, 
  token, 
  committeeId,
  lotteryResult,
  setLotteryResult
}: { 
  members: CommitteeMemberItem[]; 
  isVisible: boolean;
  token: string | null;
  committeeId: number;
  lotteryResult: CommitteeMemberItem | null;
  setLotteryResult: (result: CommitteeMemberItem | null) => void;
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const contentHeight = useRef(0);
  const scrollViewHeight = useRef(0);
  const autoScrollAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const isUserScrolling = useRef(false);
  const listHeight = SCREEN_HEIGHT * 0.5; // 50% of screen height for the list
  const [renderKey, setRenderKey] = useState(0); // Force re-render when winner changes
  const apiCalledRef = useRef(false);

  // Filter members to show only those where isUserDrawCompleted is false
  const filteredMembers = useMemo(() => {
    return members.filter((item) => {
      const isDrawCompleted = item.user?.isUserDrawCompleted ?? item.isUserDrawCompleted;
      return !isDrawCompleted; // Only show users where draw is not completed
    });
  }, [members]);

  // Helper function to check if two members are the same - memoized for performance
  const isSameMember = useCallback((member1: CommitteeMemberItem, member2: CommitteeMemberItem): boolean => {
    if (!member1 || !member2) return false;
    
    // Compare by ID first (most reliable)
    const id1 = member1.id;
    const id2 = member2.id;
    if (id1 !== undefined && id2 !== undefined && id1 === id2) {
      return true;
    }
    
    // Compare by phone number (secondary check) - normalize phone numbers
    const normalizePhone = (phone: string | null | undefined): string => {
      if (!phone) return "";
      return phone.replace(/\s+/g, "").replace(/[^\d]/g, "");
    };
    
    const phone1 = normalizePhone(member1.user?.phoneNo ?? member1.phoneNo ?? member1.phoneNumber);
    const phone2 = normalizePhone(member2.user?.phoneNo ?? member2.phoneNo ?? member2.phoneNumber);
    if (phone1 && phone2 && phone1 === phone2) {
      return true;
    }
    
    // Compare by name + phone as fallback
    const name1 = (member1.user?.name ?? member1.name ?? member1.memberName ?? member1.userName ?? "").trim().toLowerCase();
    const name2 = (member2.user?.name ?? member2.name ?? member2.memberName ?? member2.userName ?? "").trim().toLowerCase();
    if (name1 && name2 && name1 === name2 && phone1 && phone2 && phone1 === phone2) {
      return true;
    }
    
    return false;
  }, []);

  // Call lottery API during scrolling - memoized callback
  const callLotteryAPI = useCallback(async () => {
    if (!token || Number.isNaN(committeeId) || apiCalledRef.current || !isVisible) {
      return;
    }

    try {
      apiCalledRef.current = true;
      logger.log("🎲 Calling lottery API for committeeId:", committeeId);
      
      const response = await fetchLotteryRandomUser(token, committeeId);
      logger.log("📦 Lottery API response:", response);
      
      // Extract winner from response - handle different response structures
      let winner: CommitteeMemberItem | null = null;
      
      if (response?.data) {
        if (Array.isArray(response.data)) {
          winner = response.data.length > 0 ? response.data[0] : null;
        } else if (typeof response.data === 'object') {
          winner = response.data as CommitteeMemberItem;
        }
      }
      
      if (!winner) {
        logger.warn("⚠️ No winner found in API response");
        showErrorToast("No winner found in response");
        apiCalledRef.current = false;
        return;
      }
      
      logger.log("🏆 Lottery winner received:", {
        id: winner.id,
        name: winner.user?.name ?? winner.name,
        phone: winner.user?.phoneNo ?? winner.phoneNo
      });
      
      // Immediately stop all scrolling animations
      if (autoScrollAnimation.current) {
        autoScrollAnimation.current.stop();
        autoScrollAnimation.current = null;
      }
      scrollY.removeAllListeners();
      isUserScrolling.current = false;
      
      // Reset scroll position immediately
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
      scrollY.setValue(0);
      
      // Set the winner immediately - this will trigger the component to show only winner
      setLotteryResult(winner);
      setRenderKey(prev => prev + 1);
      
      // Show success message
      if (response.message) {
        showSuccessToast(response.message);
      } else {
        showSuccessToast("🎉 Winner selected!");
      }
      
    } catch (err) {
      if (isSessionExpiredError(err)) {
        return;
      }
      logger.error("❌ Failed to get lottery random user", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to get lottery result";
      showErrorToast(errorMessage);
      apiCalledRef.current = false; // Reset so it can be called again
    }
  }, [token, committeeId, isVisible]);

  useEffect(() => {
    if (!isVisible || filteredMembers.length === 0) {
      // Reset when modal closes
      if (autoScrollAnimation.current) {
        autoScrollAnimation.current.stop();
        autoScrollAnimation.current = null;
      }
      scrollY.removeAllListeners();
      setLotteryResult(null);
      apiCalledRef.current = false;
      return;
    }

    // Reset scroll position when modal opens
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    scrollY.setValue(0);
    isUserScrolling.current = false;
    // Don't reset lotteryResult here as it's managed by parent
    apiCalledRef.current = false;

    let listenerId: string | undefined;
    let timer: ReturnType<typeof setTimeout>;
    
    // Start scrolling animation first - API will be called after animation completes
    timer = setTimeout(() => {
      if (!isUserScrolling.current && contentHeight.current > scrollViewHeight.current) {
        const maxScroll = contentHeight.current - scrollViewHeight.current;
        
        // Create smooth auto-scroll animation for 2 seconds (fast scrolling)
        autoScrollAnimation.current = Animated.timing(scrollY, {
          toValue: maxScroll,
          duration: 2000, // 2 seconds for fast scrolling
          useNativeDriver: false, // scrollTo doesn't support native driver
        });

        autoScrollAnimation.current.start((finished) => {
          // After scroll animation completes, call API to get winner
          if (finished) {
            void callLotteryAPI();
          }
        });

        // Update scroll position based on animated value
        listenerId = scrollY.addListener(({ value }) => {
          if (!isUserScrolling.current) {
            scrollViewRef.current?.scrollTo({ y: value, animated: false });
          }
        });
      } else {
        // If there's no scrollable content, call API immediately
        void callLotteryAPI();
      }
    }, 300);
    
    return () => {
      clearTimeout(timer);
      if (listenerId) {
        scrollY.removeListener(listenerId);
      }
      if (autoScrollAnimation.current) {
        autoScrollAnimation.current.stop();
        autoScrollAnimation.current = null;
      }
      scrollY.removeAllListeners();
    };
  }, [isVisible, filteredMembers.length, scrollY, callLotteryAPI]);

  // Debug: Log when lotteryResult changes
  useEffect(() => {
    if (lotteryResult) {
      logger.log("🎯 Lottery result updated (displaying API result directly):", {
        id: lotteryResult.id,
        name: lotteryResult.user?.name ?? lotteryResult.name,
        phone: lotteryResult.user?.phoneNo ?? lotteryResult.phoneNo
      });
    }
  }, [lotteryResult]);

  // Stop scrolling immediately when winner is received
  useEffect(() => {
    if (lotteryResult) {
      // Immediately stop all scrolling animations
      if (autoScrollAnimation.current) {
        autoScrollAnimation.current.stop();
        autoScrollAnimation.current = null;
      }
      scrollY.removeAllListeners();
      isUserScrolling.current = false;
      
      // Immediately reset scroll position (no animation delay)
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
      scrollY.setValue(0);
    }
  }, [lotteryResult, scrollY]);

  const handleContentSizeChange = (_contentWidth: number, contentHeightValue: number) => {
    contentHeight.current = contentHeightValue;
  };

  const handleLayout = (event: { nativeEvent: { layout: { height: number } } }) => {
    scrollViewHeight.current = event.nativeEvent.layout.height;
  };

  const handleScrollBeginDrag = () => {
    // User started manual scrolling, stop auto-scroll animation
    isUserScrolling.current = true;
    if (autoScrollAnimation.current) {
      autoScrollAnimation.current.stop();
      autoScrollAnimation.current = null;
    }
    scrollY.removeAllListeners();
  };

  const handleScrollEndDrag = () => {
    // User finished manual scrolling
    isUserScrolling.current = false;
  };

  // Memoize the list items for better performance
  // When winner is selected, show only the winner; otherwise show all filtered members
  const listItems = useMemo(() => {
    // If winner is selected, show only the winner (use API result directly, no matching)
    if (lotteryResult) {
      return [{
        item: lotteryResult,
        index: 0,
        isSelected: true,
        key: `lottery-winner-${lotteryResult.id ?? 0}-${renderKey}`,
      }];
    }
    
    // No winner yet, show all filtered members
    return filteredMembers.map((item, index) => {
      return {
        item,
        index,
        isSelected: false,
        key: `lottery-user-${item.id ?? index}-${renderKey}`,
      };
    });
  }, [filteredMembers, lotteryResult, renderKey]);

  if (filteredMembers.length === 0 && !lotteryResult) {
    return (
      <View style={styles.lotteryEmptyContainer}>
        <Text style={styles.emptyText}>No members found</Text>
      </View>
    );
  }

  if (listItems.length === 0) {
    return (
      <View style={styles.lotteryEmptyContainer}>
        <Text style={styles.emptyText}>No winner found</Text>
      </View>
    );
  }

  // When winner is selected, show only winner in a dedicated display (use API result directly, no matching)
  if (lotteryResult) {
    return (
      <View style={styles.winnerDisplayContainer}>
        <AnimatedUserItem 
          key={`lottery-winner-${lotteryResult.id ?? 0}-${renderKey}`}
          item={lotteryResult} 
          index={0}
          isSelected={true}
          isWinnerOnly={true}
        />
      </View>
    );
  }

  // No winner yet, show scrolling list of all members
  return (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.lotteryScrollView, { height: listHeight }]}
      contentContainerStyle={styles.lotteryListContent}
      showsVerticalScrollIndicator={true}
      scrollEnabled={true}
      onContentSizeChange={handleContentSizeChange}
      onLayout={handleLayout}
      onScrollBeginDrag={handleScrollBeginDrag}
      onScrollEndDrag={handleScrollEndDrag}
    >
      {listItems.map(({ item, index, isSelected, key }) => (
        <AnimatedUserItem 
          key={key}
          item={item} 
          index={index}
          isSelected={isSelected}
          isWinnerOnly={false}
        />
      ))}
    </ScrollView>
  );
};

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
    committeeType?: string;
  }>();

  const committeeId = Number(params.id);

  const [activeTab, setActiveTab] = useState<DetailTab>("members");

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
  
  // State for draw amount inputs
  const [drawAmounts, setDrawAmounts] = useState<Record<number, string>>({});
  const [updatingDrawId, setUpdatingDrawId] = useState<number | null>(null);

  // Timer modal state
  const [timerModalVisible, setTimerModalVisible] = useState(false);
  const [selectedDraw, setSelectedDraw] = useState<CommitteeDrawItem | null>(null);
  const [timerMinutes, setTimerMinutes] = useState(1);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [lastAnnouncedTime, setLastAnnouncedTime] = useState<number>(-1);
  
  // Lottery users modal state
  const [lotteryModalVisible, setLotteryModalVisible] = useState(false);
  const [lotteryResult, setLotteryResult] = useState<CommitteeMemberItem | null>(null);
  const [selectedLotteryDraw, setSelectedLotteryDraw] = useState<CommitteeDrawItem | null>(null);
  
  // Refs to track current timer values for voice announcements
  const timerMinutesRef = useRef(1);
  const timerSecondsRef = useRef(0);
  const femaleVoiceRef = useRef<string | null>(null);
  
  // Ref to store debounce timeouts for draw amount updates
  const drawAmountUpdateTimeouts = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // Get available voices and select female voice
  useEffect(() => {
    const getFemaleVoice = async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        // Try to find a female voice by name patterns
        const femaleVoice = voices.find(
          (voice) => {
            const name = voice.name?.toLowerCase() || "";
            return (
              name.includes("female") ||
              name.includes("samantha") ||
              name.includes("karen") ||
              name.includes("susan") ||
              name.includes("victoria") ||
              name.includes("zira") ||
              name.includes("kate") ||
              name.includes("sarah") ||
              name.includes("emily") ||
              name.includes("linda") ||
              name.includes("helen")
            );
          }
        );
        
        if (femaleVoice) {
          femaleVoiceRef.current = femaleVoice.identifier;
        } else if (voices.length > 0) {
          // Fallback: use a voice that might be female (often index 1 or higher, avoid "male" in name)
          const possibleFemaleVoice = voices.find(
            (voice, index) => {
              const name = voice.name?.toLowerCase() || "";
              return index > 0 && !name.includes("male") && !name.includes("david") && !name.includes("daniel");
            }
          ) || (voices.length > 1 ? voices[1] : voices[0]);
          femaleVoiceRef.current = possibleFemaleVoice.identifier;
        }
      } catch (error) {
        logger.error("Error getting voices:", error);
      }
    };
    
    void getFemaleVoice();
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all pending timeouts when component unmounts
      Object.values(drawAmountUpdateTimeouts.current).forEach((timeout) => {
        clearTimeout(timeout);
      });
      drawAmountUpdateTimeouts.current = {};
    };
  }, []);

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
        setMembers(response.data ?? []);
      } catch (err) {
        // Don't show error if session expired (redirect is already happening)
        if (isSessionExpiredError(err)) {
          return;
        }
        
        logger.error("Failed to load committee members", err);
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
        // Don't show error if session expired (redirect is already happening)
        if (isSessionExpiredError(err)) {
          return;
        }
        
        logger.error("Failed to load committee analysis", err);
        const errorMessage = err instanceof Error
          ? err.message
          : "Unable to load committee analysis.";
        setAnalysisError(errorMessage);
        showErrorToast(errorMessage);
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
        const drawsData = response.data ?? [];
        setDraws(drawsData);
        // Initialize draw amounts from API data
        const initialAmounts: Record<number, string> = {};
        drawsData.forEach((draw) => {
          initialAmounts[draw.id] = draw.committeeDrawAmount.toString();
        });
        setDrawAmounts(initialAmounts);
        setDrawsLoadedOnce(true);
      } catch (err) {
        // Don't show error if session expired (redirect is already happening)
        if (isSessionExpiredError(err)) {
          return;
        }
        
        logger.error("Failed to load committee draws", err);
        const errorMessage = err instanceof Error
          ? err.message
          : "Unable to load committee draws.";
        setDrawsError(errorMessage);
        showErrorToast(errorMessage);
      } finally {
        setDrawsLoading(false);
      }
    };

    void loadDraws();
  }, [activeTab, token, committeeId, drawsLoadedOnce]);

  const handleBack = () => {
    router.back();
  };

  // Timer functions
  const handleTimerPress = (draw: CommitteeDrawItem) => {
    setSelectedDraw(draw);
    setTimerMinutes(1);
    setTimerSeconds(0);
    timerMinutesRef.current = 1;
    timerSecondsRef.current = 0;
    setIsTimerRunning(false);
    setTimerModalVisible(true);
  };

  const handleLotteryPress = (draw: CommitteeDrawItem) => {
    setSelectedLotteryDraw(draw);
    setLotteryResult(null); // Reset lottery result when opening modal
    setLotteryModalVisible(true);
  };

  const handleCloseLotteryModal = () => {
    setLotteryModalVisible(false);
    // Reset lottery state when closing
    setLotteryResult(null);
    setSelectedLotteryDraw(null);
  };

  const handleLotterySubmit = async () => {
    try {
      if (!token || !lotteryResult || !selectedLotteryDraw || Number.isNaN(committeeId)) {
        showErrorToast("Missing required information to submit lottery result");
        // Close modal even on validation error
        setLotteryModalVisible(false);
        setLotteryResult(null);
        setSelectedLotteryDraw(null);
        return;
      }
      // Get userId from lottery result
      const userId = lotteryResult.userId;
      if (!userId) {
        showErrorToast("Unable to get user ID from lottery result");
        // Close modal even on validation error
        setLotteryModalVisible(false);
        setLotteryResult(null);
        setSelectedLotteryDraw(null);
        return;
      }

      // Get draw amount from selected draw
      const userDrawAmountPaid = selectedLotteryDraw.committeeDrawAmount;

      // Call API to update lottery result
      const response = await updateLotteryResult(
        token,
        committeeId,
        userId,
        selectedLotteryDraw.id,
        userDrawAmountPaid,
      );

      // Close modal and reset state regardless of success/error
      setLotteryModalVisible(false);
      setLotteryResult(null);
      setSelectedLotteryDraw(null);

      if (response.success) {
        if (response.message) {
          showSuccessToast(response.message);
        } else {
          showSuccessToast("Lottery result submitted successfully!");
        }
      } else {
        // Show error message from API response
        const errorMsg = response.message || "Failed to submit lottery result";
        showErrorToast(errorMsg);
      }
    } catch (err) {
      try {
        // Close modal and reset state even on error
        setLotteryModalVisible(false);
        setLotteryResult(null);
        setSelectedLotteryDraw(null);

        if (isSessionExpiredError(err)) {
          return;
        }
        
        logger.error("Failed to submit lottery result", err);
        
        // Extract error message from various error formats
        let errorMessage = "Failed to submit lottery result";
        if (err instanceof Error) {
          errorMessage = err.message || errorMessage;
        } else if (typeof err === "object" && err !== null) {
          const errObj = err as any;
          errorMessage = errObj.message || errObj.error || String(errObj) || errorMessage;
        } else if (typeof err === "string") {
          errorMessage = err;
        }
        
        // Show error toast
        showErrorToast(errorMessage);
      } catch (errorHandlingError) {
        // Final safety net - catch any unexpected errors that might occur during error handling
        logger.error("Unexpected error in handleLotterySubmit error handler", errorHandlingError);
        
        // Ensure modal is closed and state is reset even if error handling fails
        try {
          setLotteryModalVisible(false);
          setLotteryResult(null);
          setSelectedLotteryDraw(null);
          showErrorToast("An unexpected error occurred. Please try again.");
        } catch (stateError) {
          // If even state reset fails, log it but don't crash
          logger.error("Error resetting state after lottery submit error", stateError);
        }
      }
    }
  };

  const handleLotteryCancel = () => {
    // Cancel action - close the modal
    setLotteryModalVisible(false);
  };

  const handleDrawAmountChange = (drawId: number, value: string) => {
    // Only allow numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");
    setDrawAmounts((prev) => ({
      ...prev,
      [drawId]: numericValue,
    }));

    // Clear existing timeout for this draw
    if (drawAmountUpdateTimeouts.current[drawId]) {
      clearTimeout(drawAmountUpdateTimeouts.current[drawId]);
    }

    // Get the original amount to compare
    const originalDraw = draws.find((d) => d.id === drawId);
    const originalAmount = originalDraw?.committeeDrawAmount.toString() || "";

    // Set a new timeout to call API after 3 seconds of no typing
    drawAmountUpdateTimeouts.current[drawId] = setTimeout(() => {
      // Only call API if the value has changed
      if (numericValue && numericValue !== originalAmount) {
        handleDrawAmountUpdate(drawId, numericValue);
      }
      // Clean up the timeout reference
      delete drawAmountUpdateTimeouts.current[drawId];
    }, 3000);
  };

  const handleDrawAmountUpdate = async (drawId: number, amount: string) => {
    if (!token || Number.isNaN(committeeId) || !amount || Number.isNaN(Number(amount))) {
      return;
    }

    const numericAmount = Number(amount);
    if (numericAmount <= 0) {
      showErrorToast("Amount must be greater than 0");
      return;
    }

    try {
      setUpdatingDrawId(drawId);
      const response = await updateDrawAmount(token, committeeId, drawId, numericAmount);
      
      if (response.message) {
        showSuccessToast(response.message);
      } else {
        showSuccessToast("Draw amount updated successfully");
      }
      
      // Reload draws to get updated data
      const drawsResponse = await fetchCommitteeDraws(token, committeeId);
      const drawsData = drawsResponse.data ?? [];
      setDraws(drawsData);
      // Update the amount in state
      setDrawAmounts((prev) => ({
        ...prev,
        [drawId]: numericAmount.toString(),
      }));
    } catch (err) {
      if (isSessionExpiredError(err)) {
        return;
      }
      
      logger.error("Failed to update draw amount", err);
      const errorMessage = err instanceof Error ? err.message : "Unable to update draw amount.";
      showErrorToast(errorMessage);
      // Revert to original amount on error
      const originalDraw = draws.find((d) => d.id === drawId);
      if (originalDraw) {
        setDrawAmounts((prev) => ({
          ...prev,
          [drawId]: originalDraw.committeeDrawAmount.toString(),
        }));
      }
    } finally {
      setUpdatingDrawId(null);
    }
  };

  const handleStartTimer = () => {
    // If timer is at 0, reset it to 1:00
    if (timerMinutes === 0 && timerSeconds === 0) {
      setTimerMinutes(1);
      setTimerSeconds(0);
      timerMinutesRef.current = 1;
      timerSecondsRef.current = 0;
    }
    setLastAnnouncedTime(-1); // Reset announcement tracking
    setIsTimerRunning(true);
    // Announce "time is start" when timer starts
    const voiceOptions: Speech.SpeechOptions = {
      language: "en",
      pitch: 1.5, // Higher pitch for female voice
      rate: 0.9,
    };
    if (femaleVoiceRef.current) {
      voiceOptions.voice = femaleVoiceRef.current;
    }
    Speech.speak("time is start", voiceOptions);
  };

  const handleResetTimer = () => {
    // Reset timer to 01:00 and start it again
    setTimerMinutes(1);
    setTimerSeconds(0);
    timerMinutesRef.current = 1;
    timerSecondsRef.current = 0;
    setLastAnnouncedTime(-1); // Reset announcement tracking
    setIsTimerRunning(true);
    // Announce "time is start" when timer resets and starts
    const voiceOptions: Speech.SpeechOptions = {
      language: "en",
      pitch: 1.5, // Higher pitch for female voice
      rate: 0.9,
    };
    if (femaleVoiceRef.current) {
      voiceOptions.voice = femaleVoiceRef.current;
    }
    Speech.speak("time is start", voiceOptions);
  };

  const handleCloseModal = () => {
    setTimerModalVisible(false);
    setIsTimerRunning(false);
    setTimerMinutes(1);
    setTimerSeconds(0);
    timerMinutesRef.current = 1;
    timerSecondsRef.current = 0;
    setLastAnnouncedTime(-1); // Reset announcement tracking
    Speech.stop(); // Stop any ongoing speech
  };

  // Update refs when state changes
  useEffect(() => {
    timerMinutesRef.current = timerMinutes;
    timerSecondsRef.current = timerSeconds;
  }, [timerMinutes, timerSeconds]);

  // Timer countdown effect with voice announcements
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (isTimerRunning && timerModalVisible) {
      interval = setInterval(() => {
        setTimerSeconds((prevSeconds) => {
          const newSeconds = prevSeconds > 0 ? prevSeconds - 1 : 59;
          const currentMinutes = timerMinutesRef.current;
          // Calculate total seconds remaining (after this tick)
          const totalSeconds = currentMinutes * 60 + (prevSeconds > 0 ? prevSeconds - 1 : (currentMinutes > 0 ? 59 : 0));
          
          // Voice announcements with female voice
          const voiceOptions: Speech.SpeechOptions = {
            language: "en",
            pitch: 1.5, // Higher pitch for female voice
            rate: 0.9,
          };
          if (femaleVoiceRef.current) {
            voiceOptions.voice = femaleVoiceRef.current;
          }
          
          if (totalSeconds <= 5 && totalSeconds > 0) {
            // Countdown for last 5 seconds: "5", "4", "3", "2", "1"
            setLastAnnouncedTime((prev) => {
              if (totalSeconds !== prev) {
                Speech.speak(`${totalSeconds}`, voiceOptions);
                return totalSeconds;
              }
              return prev;
            });
          } else if (totalSeconds > 5 && totalSeconds % 5 === 0) {
            // Announce every 5 seconds: "you have left 55 seconds", "50 seconds", etc.
            setLastAnnouncedTime((prev) => {
              if (totalSeconds !== prev) {
                const announcement = `you have left ${totalSeconds} seconds`;
                Speech.speak(announcement, voiceOptions);
                return totalSeconds;
              }
              return prev;
            });
          }
          
          // Announce "end time" when timer reaches 0
          if (totalSeconds === 0) {
            setLastAnnouncedTime((prev) => {
              if (prev !== 0) {
                Speech.speak("end time", voiceOptions);
                return 0;
              }
              return prev;
            });
          }
          
          if (prevSeconds > 0) {
            return newSeconds;
          } else {
            setTimerMinutes((prevMinutes) => {
              if (prevMinutes > 0) {
                return prevMinutes - 1;
              } else {
                setIsTimerRunning(false);
                return 0;
              }
            });
            return 59;
          }
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning, timerModalVisible]);

  // Format date helper
  const formatDrawDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";
    
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  };

  // Format time helper
  const formatDrawTime = (timeString: string): string => {
    const time = new Date(timeString);
    if (Number.isNaN(time.getTime())) return "-";
    
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    
    if (minutes === 0) {
      return `${displayHours}${period}`;
    }
    return `${displayHours}:${minutes.toString().padStart(2, "0")}${period}`;
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
  const baseCommitteeType = params.committeeType || "—"; // Get committee type from params or analysis

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
    // Members section
    const renderMember: ListRenderItem<CommitteeMemberItem> = ({ item }) => {
      
      const displayName = item.user?.name  ?? "Member";
      const email = item.user?.email ?? item.email ?? "";
      const phone = item.user?.phoneNo ?? "";
      const isDrawCompleted = item.user?.isUserDrawCompleted;

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
          {/* Draw completion status button */}
          <View
            style={[
              styles.drawStatusButton,
              isDrawCompleted ? styles.drawStatusButtonYes : styles.drawStatusButtonNo,
            ]}
          >
            <Text
              style={[
                styles.drawStatusButtonText,
                isDrawCompleted ? styles.drawStatusButtonTextYes : styles.drawStatusButtonTextNo,
              ]}
            >
              {isDrawCompleted ? "YES" : "NO"}
            </Text>
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
 // Analysis section
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

  // Draws section
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
    // Draw section
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

      // Check if draw date/time is in the future (draw not started yet)
      const now = new Date();
      const isDrawNotStarted = drawDate > now;

      
      // Check if draw is completed
      const isDrawCompleted = item.isDrawCompleted;
      
      // Get committee type (default to NORMAL if not specified)
      const committeeType = baseCommitteeType?.toUpperCase() || "NORMAL";
      const isLottery = committeeType === "LOTTERY";

      const handleDrawPress = () => {
        logger.log("Draw card pressed:", { committeeId, drawId: item.id, committeeType, isDrawCompleted });
        router.push(
          `/committee/${committeeId}/draw/${item.id}?committeeType=${committeeType}&isDrawCompleted=${isDrawCompleted}` as any,
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
              <View style={styles.drawAmountInputContainer}>
                <Text style={styles.drawAmountPrefix}>₹</Text>
                <TextInput
                  style={styles.drawAmountInput}
                  value={drawAmounts[item.id] ?? formattedDrawAmount}
                  onChangeText={(value) => handleDrawAmountChange(item.id, value)}
                  keyboardType="numeric"
                  editable={!updatingDrawId || updatingDrawId === item.id}
                  placeholder={formattedDrawAmount}
                  placeholderTextColor={colors.textSecondary}
                />
                {updatingDrawId === item.id && (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.drawAmountLoader} />
                )}
              </View>
              <View style={styles.drawDetailRow}>
              {/* <Text style={styles.drawLabel}>Max amount:</Text>
              <Text style={styles.drawValue}>₹ {formattedMinAmount}</Text> */}
              {isDrawNotStarted ? (
                <View style={styles.drawNotStartedPill}>
                  <Text
                    style={[
                      styles.statusText,
                      {color: colors.textSecondary},
                    ]}
                  >
                    {"Not Started "}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.timerPill,
                    isDrawCompleted && styles.timerPillDisabled,
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (!isDrawCompleted) {
                      if (isLottery) {
                        handleLotteryPress(item);
                      } else {
                        handleTimerPress(item);
                      }
                    }
                  }}
                  activeOpacity={isDrawCompleted ? 1 : 0.7}
                  disabled={isDrawCompleted}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: isDrawCompleted ? colors.textSecondary : "#FFD700",
                      },
                    ]}
                  >
                    {isLottery ? "Start Lottery" : "Timer"}
                  </Text>
                </TouchableOpacity>
              )}
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
        <Text style={styles.headerTitle}>Committee Details</Text>
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
              <Text style={styles.subtitle}>Committee Type: {baseCommitteeType}</Text>
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
              activeTab === "members" && styles.tabItemActive,
            ]}
            
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "members" && styles.tabTextActive,
              ]}
              numberOfLines={1}
              onPress={() => setActiveTab("members")}
            >
              Members
            </Text>
          </TouchableOpacity>
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
              numberOfLines={1}
            >
              Committee Draw  
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
              numberOfLines={1}
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

      {/* Timer Modal */}
      <Modal
        visible={timerModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDraw ? formatDrawDate(selectedDraw.committeeDrawDate) : ""} DRAW TIMER
              </Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.modalCloseButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Instructional Text */}
            <Text style={styles.modalInstruction}>
              Complete this draw within the time shown below
            </Text>

            {/* Timer Display */}
            <View style={styles.timerContainer}>
              <View style={styles.timerBox}>
                <Text style={styles.timerNumber}>
                  {timerMinutes.toString().padStart(2, "0")}
                </Text>
                <Text style={styles.timerLabel}>MIN</Text>
              </View>
              <Text style={styles.timerColon}>:</Text>
              <View style={styles.timerBox}>
                <Text style={styles.timerNumber}>
                  {timerSeconds.toString().padStart(2, "0")}
                </Text>
                <Text style={styles.timerLabel}>SEC</Text>
              </View>
            </View>

            {/* Start/Reset Timer Button */}
            <TouchableOpacity
              style={styles.startTimerButton}
              onPress={isTimerRunning ? handleResetTimer : handleStartTimer}
              activeOpacity={0.8}
            >
              <Text style={styles.startTimerButtonText}>
                {isTimerRunning
                  ? "Reset Timer"
                  : timerMinutes === 0 && timerSeconds === 0
                    ? "Restart Timer"
                    : "Start Timer"}
              </Text>
            </TouchableOpacity>

            {/* Draw Details */}
            <View style={styles.modalDrawDetails}>
              <Text style={styles.modalDrawDetailText}>
                Draw date: {selectedDraw ? formatDrawDate(selectedDraw.committeeDrawDate) : "-"}
              </Text>
              <Text style={styles.modalDrawDetailText}>
                Draw time: {selectedDraw ? formatDrawTime(selectedDraw.committeeDrawTime) : "-"}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Lottery Users Modal */}
      <Modal
        visible={lotteryModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseLotteryModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.lotteryModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lottery Result</Text>
              <TouchableOpacity
                onPress={handleCloseLotteryModal}
                style={styles.modalCloseButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Animated Users List */}
            <View style={styles.lotteryListContainer}>
              <AnimatedUsersList 
                members={members} 
                isVisible={lotteryModalVisible}
                token={token}
                committeeId={committeeId}
                lotteryResult={lotteryResult}
                setLotteryResult={setLotteryResult}
              />
            </View>

            {/* Submit and Cancel Buttons - Always at bottom */}
            <View style={styles.lotteryModalButtons}>
              <TouchableOpacity
                style={[styles.lotteryButton, styles.lotteryCancelButton]}
                onPress={handleLotteryCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.lotteryCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.lotteryButton, styles.lotterySubmitButton]}
                onPress={handleLotterySubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.lotterySubmitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: IS_SMALL_SCREEN ? 12 : 14, // Smaller font for small screens like iPhone 12 mini
    fontWeight: "600",
    color: colors.textSecondary,
    flexShrink: 0, // Prevents text from shrinking/wrapping
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
  drawStatusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  drawStatusButtonYes: {
    backgroundColor: "rgba(34, 245, 111, 0.42)", // Transparent dark green for completed
  },
  drawStatusButtonNo: {
    backgroundColor: "rgba(235, 19, 19, 0.51)", // Transparent dark red for pending/not completed
  },
  drawStatusButtonText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  drawStatusButtonTextYes: {
    color: "#ffffff",
  },
  drawStatusButtonTextNo: {
    color: "#ffffff",
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
    margin: 5,
    gap: 10,
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
  drawAmountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  drawAmountPrefix: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginRight: 4,
  },
  drawAmountInput: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    backgroundColor: colors.inputBackground || colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.textSecondary || "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
    minWidth: 80,
    flex: 1,
  },
  drawAmountLoader: {
    marginLeft: 8,
  },
  timerPill: {
    borderColor: "#FFD700",
    backgroundColor: "rgba(224, 203, 15, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: "auto",
    alignSelf: "flex-start",
  },
  timerPillDisabled: {
    opacity: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
  },
  drawNotStartedPill: {
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: "auto",
    alignSelf: "flex-start",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#8B9FFF",
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  modalInstruction: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  timerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  timerBox: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    minWidth: 80,
    alignItems: "center",
  },
  timerNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  timerLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  timerColon: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.textPrimary,
    marginHorizontal: 8,
  },
  startTimerButton: {
    backgroundColor: "#FFD700",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  startTimerButtonDisabled: {
    opacity: 0.6,
  },
  startTimerButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B1235",
  },
  modalDrawDetails: {
    alignItems: "center",
    gap: 4,
  },
  modalDrawDetailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  // Lottery Modal styles
  lotteryModalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    flexDirection: "column",
  },
  lotteryListContainer: {
    marginTop: 8,
    marginBottom: 8,
    minHeight: 200,
    maxHeight: SCREEN_HEIGHT * 0.5,
    overflow: "hidden",
  },
  winnerDisplayContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 8,
    height: 250,
    width: "100%",
  },
  lotteryScrollView: {
    width: "100%",
  },
  lotteryListContent: {
    paddingBottom: 12,
    paddingTop: 8,
    flexGrow: 1,
  },
  lotteryListContentCentered: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    flexGrow: 1,
  },
  lotteryUserCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground || colors.cardBackground,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border || "rgba(255, 255, 255, 0.1)",
  },
  lotteryUserCardSelected: {
    backgroundColor: "#22c55e",
    borderColor: "#16a34a",
    borderWidth: 2,
  },
  lotteryUserCardWinnerOnly: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 0,
    borderRadius: 24,
    width: "95%",
    maxWidth: 350,
    alignSelf: "center",
    shadowColor: "#22c55e",
    shadowOpacity: 0.5,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 8 },
    elevation: 15,
  },
  lotteryUserAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  lotteryUserAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B1235",
  },
  lotteryUserContent: {
    flex: 1,
  },
  lotteryUserContentWinnerOnly: {
    alignItems: "center",
  },
  lotteryUserName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  lotteryUserNameSelected: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  lotteryUserNameWinnerOnly: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  lotteryUserPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  lotteryUserPhoneSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  lotteryUserPhoneWinnerOnly: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  winnerBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  winnerBadgeLarge: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 2,
  },
  winnerBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  winnerBadgeTextLarge: {
    fontSize: 20,
    letterSpacing: 2,
    fontWeight: "800",
  },
  lotteryUserEmail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  lotteryUserStatusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  lotteryEmptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  // Lottery Modal Buttons
  lotteryModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border || "rgba(255, 255, 255, 0.1)",
    gap: 12,
    flexShrink: 0,
  },
  lotteryButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  lotteryCancelButton: {
    backgroundColor: colors.inputBackground || colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.textSecondary || "#6b7280",
  },
  lotterySubmitButton: {
    backgroundColor: "#FFD700",
  },
  lotteryCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  lotterySubmitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B1235",
  },
});

export default CommitteeAnalysisScreen;


