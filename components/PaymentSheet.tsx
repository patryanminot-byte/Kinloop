import React, { useState } from "react";
import { View, Text, Modal, StyleSheet, Alert } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import * as Haptics from "expo-haptics";
import { supabase } from "../lib/supabase";
import { calculateTotal, feeLabel } from "../lib/stripe";
import { colors } from "../lib/colors";
import Button from "./ui/Button";

// NOTE: <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}> must wrap
// the app in app/_layout.tsx for useStripe() to work.

interface PaymentSheetProps {
  visible: boolean;
  itemId: string;
  itemName: string;
  itemEmoji: string;
  itemPrice: number;
  sellerId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentSheet({
  visible,
  itemId,
  itemName,
  itemEmoji,
  itemPrice,
  sellerId,
  onSuccess,
  onCancel,
}: PaymentSheetProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const { itemPrice: price, fee, total } = calculateTotal(itemPrice);

  const handlePay = async () => {
    setLoading(true);
    try {
      // 1. Create PaymentIntent via edge function
      const { data, error: fnError } = await supabase.functions.invoke(
        "create-payment-intent",
        {
          body: {
            itemId,
            buyerId: (await supabase.auth.getUser()).data.user?.id,
            sellerId,
            amount: itemPrice,
          },
        },
      );

      if (fnError || !data?.clientSecret) {
        throw new Error(fnError?.message ?? "Failed to create payment");
      }

      // 2. Initialize the Stripe payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: data.clientSecret,
        merchantDisplayName: "Kinloop",
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // 3. Present the payment sheet to the user
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        // User cancelled — not a real error
        if (presentError.code === "Canceled") {
          return;
        }
        throw new Error(presentError.message);
      }

      // 4. Success
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Payment failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <Text style={styles.emoji}>{itemEmoji}</Text>
          <Text style={styles.itemName}>{itemName}</Text>

          {/* Price breakdown */}
          <View style={styles.breakdown}>
            <View style={styles.row}>
              <Text style={styles.label}>Item</Text>
              <Text style={styles.value}>${price}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Kinloop fee</Text>
              <Text style={styles.value}>${fee}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total}</Text>
            </View>
          </View>

          <Text style={styles.feeHint}>{feeLabel(itemPrice)}</Text>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              variant="primary"
              size="lg"
              title={loading ? "Processing..." : `Pay $${total}`}
              onPress={handlePay}
              disabled={loading}
              style={styles.payButton}
            />
            <Button
              variant="ghost"
              size="md"
              title="Cancel"
              onPress={onCancel}
              disabled={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 20,
    textAlign: "center",
  },
  breakdown: {
    width: "100%",
    gap: 10,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 15,
    color: colors.textMuted,
  },
  value: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  feeHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 20,
  },
  actions: {
    width: "100%",
    gap: 8,
    alignItems: "center",
  },
  payButton: {
    width: "100%",
  },
});
