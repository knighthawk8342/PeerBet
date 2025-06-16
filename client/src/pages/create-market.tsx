import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  stakeAmount: z.string().min(1, "Stake amount is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateMarket() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [stakeAmount, setStakeAmount] = useState(0);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      stakeAmount: "",
      expiryDate: "",
    },
  });

  const createMarketMutation = useMutation({
    mutationFn: async (data: any) => {
      const transformedData = {
        ...data,
        stakeAmount: data.stakeAmount.toString(),
        expiryDate: data.expiryDate,
      };
      await apiRequest("POST", "/api/markets", transformedData);
    },
    onSuccess: () => {
      toast({
        title: "Market Created",
        description: "Your market has been created successfully!",
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
    createMarketMutation.mutate(data);
  };

  const platformFee = stakeAmount * 0.02;
  const totalPool = stakeAmount * 2;
  const winnerAmount = totalPool - (totalPool * 0.02);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Market</h1>
          <p className="text-gray-600">Set up a 1v1 prediction market for others to join</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Market Details</CardTitle>
              </CardHeader>
              <CardContent>
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
                            <FormLabel>Stake Amount ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                step="0.01"
                                placeholder="100.00"
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
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Market Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Your stake:</span>
                  <span className="font-medium">${stakeAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Platform fee (2%):</span>
                  <span className="font-medium">${platformFee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-900 font-medium">Winner takes:</span>
                    <span className="font-semibold text-green-600">${winnerAmount.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3 mt-4">
                  <p className="text-sm text-blue-800">
                    <i className="fas fa-info-circle mr-1"></i>
                    Your opponent will need to stake the same amount to join this market.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
