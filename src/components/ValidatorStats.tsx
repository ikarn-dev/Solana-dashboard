import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ValidatorStatsProps {
  totalValidators: number;
  superminority: number;
  skipRate: number;
  weightedSkipRate: number;
  nominalStakingAPY: number;
  nodeVersions: {
    version: string;
    percentage: number;
  }[];
}

export function ValidatorStats({
  totalValidators,
  superminority,
  skipRate,
  weightedSkipRate,
  nominalStakingAPY,
  nodeVersions
}: ValidatorStatsProps) {
  // Prepare data for pie chart
  const versionData = nodeVersions.map((version, index) => ({
    name: version.version,
    value: version.percentage,
    color: `hsl(${200 + index * 20}, 70%, ${80 - index * 5}%)`
  }));

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700">{data.name}</p>
          <p className="text-sm text-gray-600">{data.value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-card bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Validators Count */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <small className="text-gray-500 mr-2">Validators</small>
            </div>
            <div className="text-2xl font-mono">
              {totalValidators.toLocaleString()}
            </div>
          </div>
          <small className="text-gray-500">
            Superminority: <span className="text-lime-600">{superminority}</span>
          </small>
        </div>

        {/* Skip Rate */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <small className="text-gray-500 mr-2">Skip Rate</small>
            </div>
            <div className="text-2xl font-mono">
              {skipRate.toFixed(2)}%
            </div>
          </div>
          <small className="text-gray-500">
            Weighted: <span className="text-lime-600">{weightedSkipRate.toFixed(2)}%</span>
          </small>
        </div>

        {/* Nominal Staking APY */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <small className="text-gray-500 mr-2">Nominal Staking APY</small>
            </div>
            <div className="text-2xl font-mono text-lime-600">
              {nominalStakingAPY.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Node Versions */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <small className="text-gray-500">Node Versions</small>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              {nodeVersions.map((version, index) => (
                <div key={version.version} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: `hsl(${200 + index * 20}, 70%, ${80 - index * 5}%)` }}
                    />
                    <span className="text-sm font-mono">{version.version}</span>
                  </div>
                  <span className="text-sm text-gray-600">({version.percentage}%)</span>
                </div>
              ))}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={versionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {versionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 