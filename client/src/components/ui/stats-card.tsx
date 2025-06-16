interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: "primary" | "success" | "warning" | "gray" | "destructive";
}

export function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const colorClasses = {
    primary: "bg-blue-100 text-blue-600",
    success: "bg-green-100 text-green-600",
    warning: "bg-orange-100 text-orange-600",
    gray: "bg-gray-100 text-gray-600",
    destructive: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <i className={`${icon} text-sm`}></i>
          </div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
