import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { User, Download, LayoutDashboard } from "lucide-react"
import { format } from "date-fns"
import { useNavigate } from "react-router-dom"

interface Enhancement {
  id: string
  original_file_name: string
  preset_used: string
  created_at: string
  enhanced_file_path: string
}

const UserPanel = () => {
  const { user, signOut } = useAuth()
  const [enhancements, setEnhancements] = useState<Enhancement[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      fetchEnhancements()
    }
  }, [user])

  const fetchEnhancements = async () => {
    const { data, error } = await supabase
      .from("audio_enhancements")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching enhancements:", error)
    } else {
      setEnhancements(data)
    }
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
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>User Profile</SheetTitle>
        </SheetHeader>
        <div className="py-4 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Signed in as: {user?.email}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/app")}>
              <LayoutDashboard className="h-4 w-4" />
              View Dashboard
            </Button>
            <Button variant="destructive" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-4">Enhancement History</h3>
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Preset</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enhancements.map((enhancement) => (
                  <TableRow key={enhancement.id}>
                    <TableCell>{enhancement.original_file_name}</TableCell>
                    <TableCell>{enhancement.preset_used}</TableCell>
                    <TableCell>
                      {format(new Date(enhancement.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          downloadEnhancement(
                            enhancement.enhanced_file_path,
                            `enhanced_${enhancement.original_file_name}`
                          )
                        }
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default UserPanel
