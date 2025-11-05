"use client"

import { KPICard } from "@/components/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, CheckCircle2, TrendingUp } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

const revenueData = [
  { month: "Jan", revenue: 12000 },
  { month: "Feb", revenue: 19000 },
  { month: "Mar", revenue: 15000 },
  { month: "Apr", revenue: 25000 },
  { month: "May", revenue: 22000 },
  { month: "Jun", revenue: 30000 },
]

const projectsData = [
  { name: "Planning", count: 5 },
  { name: "Active", count: 12 },
  { name: "Completed", count: 23 },
  { name: "On Hold", count: 3 },
]

export default function DashboardPage() {
  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Revenue"
            value="$123,456"
            icon={DollarSign}
            trend={{ value: 12.5, isPositive: true }}
          />
          <KPICard
            title="Active Customers"
            value="234"
            icon={Users}
            trend={{ value: 8.2, isPositive: true }}
          />
          <KPICard
            title="Completed Tasks"
            value="89"
            icon={CheckCircle2}
            trend={{ value: -3.1, isPositive: false }}
          />
          <KPICard
            title="Active Projects"
            value="12"
            icon={TrendingUp}
            trend={{ value: 15.3, isPositive: true }}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projects by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
