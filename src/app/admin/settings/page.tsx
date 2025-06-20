// src/app/admin/settings/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Settings, Calendar, MapPin, Mail, Shield, Database, Bell } from 'lucide-react'

export default function SettingsPage() {
  const eventSettings = {
    eventName: 'EMS Trade Fair VIP Experience',
    startDate: '2025-07-26',
    endDate: '2025-08-06',
    venue: 'Malta Fairs and Conventions Centre',
    address: 'Ta\' Qali, Malta',
    boothLocation: 'EMS Booth - MFCC',
    registrationEnabled: true
  }

  const systemSettings = {
    emailProvider: 'Resend',
    databaseStatus: 'Connected',
    backupFrequency: 'Daily',
    lastBackup: '2025-06-18T02:00:00Z'
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure event details and system settings
        </p>
      </div>

      {/* Event Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Configuration
          </CardTitle>
          <CardDescription>
            Manage event details and registration settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Event Name</label>
              <Input value={eventSettings.eventName} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Booth Location</label>
              <Input value={eventSettings.boothLocation} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input type="date" value={eventSettings.startDate} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input type="date" value={eventSettings.endDate} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Venue</label>
              <Input value={eventSettings.venue} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Address</label>
              <Input value={eventSettings.address} />
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <h4 className="font-medium">Registration Status</h4>
              <p className="text-sm text-gray-600">Allow new client registrations</p>
            </div>
            <Badge variant={eventSettings.registrationEnabled ? 'default' : 'secondary'}>
              {eventSettings.registrationEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          
          <Button>Save Event Settings</Button>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>
            System status and configuration details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="font-medium">Email Service</span>
                </div>
                <Badge variant="default">{systemSettings.emailProvider}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="font-medium">Database</span>
                </div>
                <Badge variant="default">{systemSettings.databaseStatus}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Backup Frequency</span>
                </div>
                <Badge variant="secondary">{systemSettings.backupFrequency}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="font-medium">Last Backup</span>
                </div>
                <span className="text-sm text-gray-600">
                  {new Date(systemSettings.lastBackup).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Quick Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Backup Database
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Test Email Service
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Export Settings
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Users
          </CardTitle>
          <CardDescription>
            Manage administrator accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Admin User</p>
                <p className="text-sm text-gray-600">admin@ems-events.com</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>SUPER_ADMIN</Badge>
                <Badge variant="outline">Active</Badge>
              </div>
            </div>
            
            <Button variant="outline">
              Add New Admin User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div>
              <h4 className="font-medium text-red-800">Reset All Data</h4>
              <p className="text-sm text-red-600">This will permanently delete all registrations, tickets, and leads</p>
            </div>
            <Button variant="destructive">
              Reset Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}