import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import { FloatingNav } from "@/components/FloatingNavbar"

const navItems = [
  { name: "Home", link: "/" },
  { name: "About", link: "/" },
  { name: "Features", link: "/" },
  { name: "Support", link: "/" },
]

const Landing = () => {
  const navigate = useNavigate()

  return (
    <>
      <FloatingNav navItems={navItems} />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-6">
            <div className="flex justify-center items-center space-x-2 mb-6"></div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Aurelia Studio
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Professional audio and video processing made simple. Transform
              your media with powerful AI-driven tools.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <Card className="border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-center space-x-2">
                  <span>Audio Processing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Advanced audio enhancement with presets and manual controls
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-center space-x-2">
                  <span>Video Export</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Export your processed audio as video files with ease
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-center space-x-2">
                  <span>AI Powered</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Intelligent processing algorithms for professional results
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              variant="default"
              size="lg"
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto"
            >
              Try Demo
            </Button>
          </div>
          <div className="pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Experience the future of audio and video processing
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Landing
