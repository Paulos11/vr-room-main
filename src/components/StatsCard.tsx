// src/components/StatsCard.tsx - Statistics Display Component

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, TrendingUp, Users, AlertTriangle, CheckCircle } from 'lucide-react'
import type { StatsCardProps } from '../types/scanner'

export function StatsCard({ stats }: StatsCardProps) {
  const successRate = stats.validEntries + stats.deniedEntries > 0 
    ? Math.round((stats.validEntries / (stats.validEntries + stats.deniedEntries)) * 100)
    : 0

  return (
    <Card className="border-2 border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Today's Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Total Scans */}
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.scansToday}</div>
            <div className="text-sm text-gray-600 font-medium">Total Scans</div>
            <div className="text-xs text-gray-500 mt-1">All attempts</div>
          </div>

          {/* Valid Entries */}
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.validEntries}</div>
            <div className="text-sm text-gray-600 font-medium">Valid Entries</div>
            <div className="text-xs text-gray-500 mt-1">Allowed access</div>
          </div>

          {/* Denied Entries */}
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.deniedEntries}</div>
            <div className="text-sm text-gray-600 font-medium">Denied Entries</div>
            <div className="text-xs text-gray-500 mt-1">Access denied</div>
          </div>

          {/* Success Rate */}
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{successRate}%</div>
            <div className="text-sm text-gray-600 font-medium">Success Rate</div>
            <div className="text-xs text-gray-500 mt-1">Valid vs total</div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            
            {/* Duplicate Scans */}
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded border border-yellow-200">
              <span className="text-gray-700 font-medium">Duplicate Scans:</span>
              <span className="text-yellow-700 font-bold">{stats.duplicateScans}</span>
            </div>

            {/* Average per Hour */}
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
              <span className="text-gray-700 font-medium">Avg per Hour:</span>
              <span className="text-gray-700 font-bold">
                {stats.lastScanTime 
                  ? Math.round(stats.scansToday / Math.max(1, (Date.now() - new Date(stats.lastScanTime).setHours(0,0,0,0)) / 3600000))
                  : 0}
              </span>
            </div>

            {/* Last Activity */}
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
              <span className="text-gray-700 font-medium">Last Activity:</span>
              <span className="text-gray-700 font-bold">
                {stats.lastScanTime 
                  ? Math.round((Date.now() - stats.lastScanTime.getTime()) / 60000) + 'm ago'
                  : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Scanner Performance:</span>
            <div className="flex items-center gap-2">
              {successRate >= 90 ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">Excellent</span>
                </>
              ) : successRate >= 75 ? (
                <>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium text-yellow-700">Good</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-red-700">Needs Attention</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}