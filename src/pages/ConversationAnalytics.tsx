import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Heart, TrendingUp, MessageSquare, Sparkles, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format, subDays } from 'date-fns'

interface AnalyticsData {
  date: string
  total_conversations: number
  avg_confidence: number
  sentiment_distribution: Record<string, number> | null
  mood_distribution: Record<string, number> | null
  most_common_keywords: string[] | null
}

const SENTIMENT_COLORS = {
  positive: 'hsl(var(--chart-1))',
  excited: 'hsl(var(--chart-2))',
  neutral: 'hsl(var(--chart-3))',
  curious: 'hsl(var(--chart-4))',
  frustrated: 'hsl(var(--chart-5))',
  negative: 'hsl(var(--destructive))',
  anxious: 'hsl(var(--warning))',
  happy: 'hsl(var(--chart-1))',
  tired: 'hsl(var(--muted))',
}

export default function ConversationAnalytics() {
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState('30')
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([])
  const [loading, setLoading] = useState(true)
  const [totalInteractions, setTotalInteractions] = useState(0)
  const [avgConfidence, setAvgConfidence] = useState(0)

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user, timeRange])

  const loadAnalytics = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const endDate = new Date()
      const startDate = subDays(endDate, parseInt(timeRange))

      const { data, error } = await supabase.rpc('get_conversation_analytics', {
        _user_id: user.id,
        _start_date: startDate.toISOString(),
        _end_date: endDate.toISOString()
      })

      if (error) throw error

      if (data) {
        // Type-safe conversion
        const typedData = data.map(day => ({
          ...day,
          sentiment_distribution: (day.sentiment_distribution as Record<string, number>) || null,
          mood_distribution: (day.mood_distribution as Record<string, number>) || null,
          most_common_keywords: (day.most_common_keywords as string[]) || null
        }))
        
        setAnalytics(typedData)
        
        // Calculate totals
        const total = typedData.reduce((sum, day) => sum + (day.total_conversations || 0), 0)
        const avgConf = typedData.reduce((sum, day) => sum + (day.avg_confidence || 0), 0) / (typedData.length || 1)
        
        setTotalInteractions(total)
        setAvgConfidence(avgConf)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Prepare chart data
  const conversationTrend = analytics.map(day => ({
    date: format(new Date(day.date), 'MMM dd'),
    conversations: day.total_conversations,
    confidence: Math.round(day.avg_confidence * 100)
  }))

  // Aggregate sentiment distribution
  const sentimentData = Object.entries(
    analytics.reduce((acc, day) => {
      if (day.sentiment_distribution) {
        Object.entries(day.sentiment_distribution).forEach(([sentiment, count]) => {
          acc[sentiment] = (acc[sentiment] || 0) + Number(count)
        })
      }
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  // Aggregate mood distribution
  const moodData = Object.entries(
    analytics.reduce((acc, day) => {
      if (day.mood_distribution) {
        Object.entries(day.mood_distribution).forEach(([mood, count]) => {
          acc[mood] = (acc[mood] || 0) + Number(count)
        })
      }
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  // Get all keywords
  const allKeywords = analytics
    .flatMap(day => day.most_common_keywords || [])
    .filter((k, i, arr) => arr.indexOf(k) === i)
    .slice(0, 10)

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Conversation Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track your child's emotional patterns and engagement with Jubee
            </p>
          </div>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInteractions}</div>
              <p className="text-xs text-muted-foreground">
                conversations in last {timeRange} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(avgConfidence * 100)}%</div>
              <p className="text-xs text-muted-foreground">
                sentiment detection accuracy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Mood</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {moodData.length > 0 ? moodData[0].name : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                most frequent emotional state
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="moods">Moods</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversation Activity</CardTitle>
                <CardDescription>
                  Daily conversation count and sentiment confidence over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={conversationTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="conversations" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Conversations"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="confidence" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                      name="Confidence %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Distribution</CardTitle>
                  <CardDescription>
                    Overall emotional sentiment patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] || '#888'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Breakdown</CardTitle>
                  <CardDescription>
                    Detailed count by sentiment type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sentimentData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))">
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] || '#888'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="moods" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mood Distribution</CardTitle>
                  <CardDescription>
                    How your child has been feeling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={moodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {moodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] || '#888'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mood Frequency</CardTitle>
                  <CardDescription>
                    Count of interactions by mood
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={moodData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))">
                        {moodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] || '#888'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="keywords" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Common Topics & Emotions</CardTitle>
                <CardDescription>
                  Most frequent keywords detected in conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {allKeywords.length > 0 ? (
                    allKeywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No keywords detected yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
