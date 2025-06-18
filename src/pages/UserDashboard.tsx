import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, ArrowLeft, History, User } from "lucide-react"
import { format } from "date-fns"
import { Link } from "react-router-dom"

interface Enhancement {
  id: string
  original_file_name: string
  preset_used: string
  created_at: string
  enhanced_file_path: string
}

const UserDashboard = () => {
  const { user, signOut } = useAuth()
  const [enhancements, setEnhancements] = useState<Enhancement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchEnhancements()
    }
  }, [user])

  const fetchEnhancements = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("audio_enhancements")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching enhancements:", error)
    } else {
      setEnhancements(data || [])
    }
    setIsLoading(false)
  }

  const downloadEnhancement = async (path: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("audio")
        .download(path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading file:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-sonic-purple to-sonic-purple-light bg-clip-text text-transparent">
              Aurelia Studio
            </h1>
            <p className="text-sm text-muted-foreground">User Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/app">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <Button onClick={signOut} variant="destructive" size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-6">
        <Tabs defaultValue="history" className="space-y-6">
          <TabsList>
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" /> Enhancement History
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" /> Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Audio Enhancements</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Loading your enhancements...
                  </div>
                ) : enhancements.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>You haven't enhanced any audio files yet.</p>
                    <Link to="/legacy" className="mt-4 inline-block">
                      <Button>Go to Studio</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Original File</TableHead>
                          <TableHead>Preset Used</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enhancements.map((enhancement) => (
                          <TableRow key={enhancement.id}>
                            <TableCell className="font-medium">
                              {enhancement.original_file_name}
                            </TableCell>
                            <TableCell>{enhancement.preset_used}</TableCell>
                            <TableCell>
                              {format(
                                new Date(enhancement.created_at),
                                "MMM d, yyyy"
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  downloadEnhancement(
                                    enhancement.enhanced_file_path,
                                    `enhanced_${enhancement.original_file_name}`
                                  )
                                }
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p>
                    <strong>Email:</strong> {user?.email}
                  </p>
                  <p>
                    <strong>User ID:</strong> {user?.id}
                  </p>
                  <p>
                    <strong>Account Created:</strong>{" "}
                    {user?.created_at
                      ? format(new Date(user.created_at), "MMM d, yyyy")
                      : "Unknown"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-card">
        <div className="container mx-auto py-4 px-6 text-center text-sm text-muted-foreground">
          <p>Aurelia - Browser-based audio enhancement</p>
        </div>
      </footer>
    </div>
  )
}

export default UserDashboard
