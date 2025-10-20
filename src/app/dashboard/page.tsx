'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FolderOpen, CheckSquare, DollarSign } from 'lucide-react'

const stats = [
  {
    title: 'Total Clients',
    value: '12',
    description: '+2 from last month',
    icon: Users,
  },
  {
    title: 'Active Projects',
    value: '8',
    description: '+1 from last week',
    icon: FolderOpen,
  },
  {
    title: 'Pending Tasks',
    value: '24',
    description: '6 due this week',
    icon: CheckSquare,
  },
  {
    title: 'Revenue',
    value: '$12,450',
    description: '+15% from last month',
    icon: DollarSign,
  },
]

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your projects.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      New client "Acme Corp" added
                    </p>
                    <p className="text-sm text-muted-foreground">
                      2 hours ago
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Project "Website Redesign" completed
                    </p>
                    <p className="text-sm text-muted-foreground">
                      1 day ago
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Invoice #1234 sent to client
                    </p>
                    <p className="text-sm text-muted-foreground">
                      3 days ago
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>
                Tasks due in the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Design mockups review
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Due tomorrow
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Client presentation
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Due in 3 days
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Project milestone delivery
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Due in 5 days
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}