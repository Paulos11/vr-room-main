// src/components/Header.tsx - Scanner Header Component

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Zap, Calendar, MapPin } from 'lucide-react'
import { formatTime, formatScanCount } from '../utils/scannerUtils'
import type { HeaderProps } from '../types/scanner'

export function Header({ 
  staffName, 
  onStaffNameChange, 
  stats 
}: HeaderProps) {
  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-3">
          <Zap className="h-8 w-8" />
          Fast QR Ticket Scanner
        </CardTitle>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-blue-100">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>Malta Fairs & Conventions Centre</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>June 26 - July 6, 2025</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          {/* Staff Name Input */}
          <div className="md:col-span-1">
            <label className="text-sm font-medium mb-2 block text-blue-100">
              Staff Name:
            </label>
            <Input
              placeholder="Enter your name"
              value={staffName}
              onChange={(e) => onStaffNameChange(e.target.value)}
              className="bg-white text-gray-900 border-0 shadow-sm"
            />
          </div>

          {/* Stats Display */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            
            {/* Scan Count */}
            <div className="text-center bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">{stats.scansToday}</div>
              <div className="text-xs opacity-80">
                {formatScanCount(stats.scansToday)} Today
              </div>
            </div>

            {/* Last Scan Time */}
            <div className="text-center bg-white/10 rounded-lg p-3">
              <div className="text-lg font-medium">
                {stats.lastScanTime ? formatTime(stats.lastScanTime) : '--:--:--'}
              </div>
              <div className="text-xs opacity-80">Last Scan</div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row for larger screens */}
        <div className="hidden sm:grid sm:grid-cols-4 gap-2 mt-4 text-center">
          <div className="bg-white/10 rounded p-2">
            <div className="font-bold text-green-200">{stats.validEntries}</div>
            <div className="text-xs opacity-75">Valid</div>
          </div>
          <div className="bg-white/10 rounded p-2">
            <div className="font-bold text-red-200">{stats.deniedEntries}</div>
            <div className="text-xs opacity-75">Denied</div>
          </div>
          <div className="bg-white/10 rounded p-2">
            <div className="font-bold text-yellow-200">{stats.duplicateScans}</div>
            <div className="text-xs opacity-75">Duplicates</div>
          </div>
          <div className="bg-white/10 rounded p-2">
            <div className="font-bold text-blue-200">
              {stats.validEntries + stats.deniedEntries > 0 
                ? Math.round((stats.validEntries / (stats.validEntries + stats.deniedEntries)) * 100)
                : 0}%
            </div>
            <div className="text-xs opacity-75">Success Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}