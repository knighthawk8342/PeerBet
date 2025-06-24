import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function AdminRefunds() {
  const { toast } = useToast();

  const { data: refundTransactions, isLoading } = useQuery({
    queryKey: ['/api/admin/refunds'],
    retry: false,
  });

  const handleProcessRefund = async (transactionId: number, userWallet: string, amount: string) => {
    toast({
      title: "Manual Refund Required",
      description: `Please manually send ${amount} SOL to wallet ${userWallet}`,
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading refund requests...</div>;
  }

  const pendingRefunds = (refundTransactions || []).filter((t: any) => 
    t.type === "refund" && !t.paymentSignature
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Refund Management</h1>
        <p className="text-gray-600 mt-2">Process pending SOL refunds for closed markets</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Refunds ({pendingRefunds.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRefunds.length === 0 ? (
            <p className="text-gray-600">No pending refunds</p>
          ) : (
            <div className="space-y-4">
              {pendingRefunds.map((refund: any) => (
                <div key={refund.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{refund.description}</h3>
                      <p className="text-sm text-gray-600">User: {refund.userId}</p>
                      <p className="text-sm text-gray-600">Amount: {refund.amount} SOL</p>
                      <p className="text-sm text-gray-600">
                        Date: {new Date(refund.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Pending</Badge>
                      <Button
                        size="sm"
                        onClick={() => handleProcessRefund(refund.id, refund.userId, refund.amount)}
                      >
                        Process Refund
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Refund Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p><strong>Manual Refund Process:</strong></p>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Click "Process Refund" for each pending refund</li>
              <li>Manually send the specified SOL amount to the user's wallet</li>
              <li>Record the transaction signature in the admin panel</li>
              <li>Update the refund status to completed</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}