import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BasicSOLPayment } from "@/components/payment/BasicSOLPayment";
import { useToast } from "@/hooks/use-toast";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  stakeAmount: z.string().min(1, "Stake amount is required").refine((val) => {
    const num = parseFloat(val);
    return num >= 0.01;
  }, "Minimum stake amount is 0.01 SOL"),
  odds: z.string().min(1, "Odds are required").refine((val) => {
    const num = parseFloat(val);
    return num >= 0.1 && num <= 10;
  }, "Odds must be between 0.1 and 10"),
  expiryDate: z.string().min(1, "Expiry date is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateMarket() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { connected, publicKey } = useSolanaWallet();
  const [stakeAmount, setStakeAmount] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingMarketData, setPendingMarketData] = useState<FormData | null>(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      stakeAmount: "",
      odds: "1.00",
      expiryDate: "",
    },
  });

  const createMarketMutation = useMutation({
    mutationFn: async (data: any) => {
      const creatorStake = parseFloat(data.stakeAmount);
      const odds = parseFloat(data.odds);
      const counterpartyStake = creatorStake / odds;
      
      const transformedData = {
        ...data,
        stakeAmount: creatorStake.toString(),
        counterpartyStakeAmount: counterpartyStake.toString(),
        odds: odds.toString(),
        expiryDate: data.expiryDate,
        paymentSignature: data.paymentSignature,
      };
      await apiRequest("POST", "/api/markets", transformedData);
    },
    onSuccess: () => {
      toast({
        title: "Market Created",
        description: "Your market has been created successfully after USDC payment confirmation!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create market",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your Solana wallet to create a market",
        variant: "destructive",
      });
      return;
    }

    // Ensure wallet public key is set for API authentication
    if (typeof window !== 'undefined') {
      (window as any).currentWalletPublicKey = publicKey;
    }

    // Store form data and open payment modal
    setPendingMarketData(data);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentComplete = (paymentSignature: string) => {
    if (pendingMarketData && publicKey) {
      // Set wallet public key in global state for API authentication
      if (typeof window !== 'undefined') {
        (window as any).currentWalletPublicKey = publicKey;
      }
      
      // Process market creation after successful SOL payment
      const dataWithPayment = {
        ...pendingMarketData,
        paymentSignature
      };
      createMarketMutation.mutate(dataWithPayment);
      setPendingMarketData(null);
      setIsPaymentModalOpen(false);
    }
  };

  const platformFee = stakeAmount * 0.02;
  const totalPool = stakeAmount * 2;
  const winnerAmount = totalPool - (totalPool * 0.02);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Create New Market
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Set up a 1v1 prediction market for others to join</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Market Details</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your prediction market</p>
              </div>
              <div className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Market Question</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Will Bitcoin reach $100k by end of 2024?"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Additional details about the market conditions..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="crypto">Crypto</SelectItem>
                                <SelectItem value="sports">Sports</SelectItem>
                                <SelectItem value="stocks">Stocks</SelectItem>
                                <SelectItem value="politics">Politics</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="stakeAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stake Amount (SOL)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="0.10"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value);
                                  setStakeAmount(parseFloat(value) || 0);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="odds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Odds (Your Stake : Counterparty Stake)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.1"
                              max="10"
                              placeholder="1.00"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            E.g., 2.00 means you stake 2x what the counterparty stakes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              min={new Date().toISOString().slice(0, 16)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation("/")}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMarketMutation.isPending}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        {createMarketMutation.isPending ? "Creating..." : "Create Market"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Market Summary</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review your market details</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Your stake:</span>
                  <span className="font-medium">{stakeAmount.toFixed(2)} SOL</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Platform fee (2%):</span>
                  <span className="font-medium">{platformFee.toFixed(2)} SOL</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-900 font-medium">Winner takes:</span>
                    <span className="font-semibold text-green-600">{winnerAmount.toFixed(2)} SOL</span>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3 mt-4">
                  <p className="text-sm text-blue-800">
                    <i className="fas fa-info-circle mr-1"></i>
                    Your opponent will need to stake the same amount to join this market.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                  <p className="text-sm text-green-800">
                    <i className="fas fa-dollar-sign mr-1"></i>
                    Payment required: {stakeAmount.toFixed(2)} SOL on Solana
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* USDC Payment Modal */}
        <BasicSOLPayment
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentComplete={handlePaymentComplete}
          amount={stakeAmount.toFixed(2)}
          marketTitle={pendingMarketData?.title || "New Market"}
          action="create"
        />
      </div>
    </div>
  );
}
