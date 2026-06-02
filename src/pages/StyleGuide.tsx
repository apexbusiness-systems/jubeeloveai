import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { SEO } from "@/components/SEO";
import { PageTransition } from "@/components/PageTransition";

const StyleGuide = () => {
  const [progress, setProgress] = useState(45);
  const [sliderValue, setSliderValue] = useState([50]);

  const ComponentSection = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
    <div className="mb-12">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );

  const VariantShowcase = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  );

  const CodeBlock = ({ code }: { code: string }) => (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
      <code className="text-foreground">{code}</code>
    </pre>
  );

  return (
    <PageTransition>
      <SEO 
        title="Style Guide - UI Components"
        description="Comprehensive style guide showing all UI components, variants, and usage patterns"
      />
      
      <div className="min-h-screen bg-background p-6 pb-24" role="main" aria-label="Style guide">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-extrabold text-foreground mb-4">Style Guide</h1>
            <p className="text-xl text-muted-foreground">
              Comprehensive documentation of all UI components, their variants, and usage patterns for consistency across the application.
            </p>
          </div>

          <Tabs defaultValue="components" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
            </TabsList>

            {/* Components Tab */}
            <TabsContent value="components" className="space-y-8">
              {/* Buttons */}
              <ComponentSection 
                title="Buttons" 
                description="Interactive elements for actions and navigation"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Button Variants</CardTitle>
                    <CardDescription>All available button styles and sizes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <VariantShowcase label="Variants">
                      <Button variant="default">Default</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="destructive">Destructive</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="link">Link</Button>
                    </VariantShowcase>

                    <VariantShowcase label="Sizes">
                      <Button size="sm">Small</Button>
                      <Button size="default">Default</Button>
                      <Button size="lg">Large</Button>
                      <Button size="icon" aria-label="Confirm" title="Confirm">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </VariantShowcase>

                    <VariantShowcase label="States">
                      <Button disabled>Disabled</Button>
                      <Button>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        With Icon
                      </Button>
                    </VariantShowcase>
                  </CardContent>
                  <CardFooter>
                    <CodeBlock code={`<Button variant="default">Click me</Button>\n<Button variant="outline" size="lg">Large Button</Button>`} />
                  </CardFooter>
                </Card>
              </ComponentSection>

              {/* Badges */}
              <ComponentSection 
                title="Badges" 
                description="Small labels for status, categories, and metadata"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Badge Variants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VariantShowcase label="Variants">
                      <Badge variant="default">Default</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="destructive">Destructive</Badge>
                      <Badge variant="outline">Outline</Badge>
                    </VariantShowcase>
                  </CardContent>
                  <CardFooter>
                    <CodeBlock code={`<Badge variant="default">New</Badge>\n<Badge variant="outline">Beta</Badge>`} />
                  </CardFooter>
                </Card>
              </ComponentSection>

              {/* Alerts */}
              <ComponentSection 
                title="Alerts" 
                description="Contextual feedback messages for users"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Alert Variants</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Default Alert</AlertTitle>
                      <AlertDescription>
                        This is a default alert with informational content.
                      </AlertDescription>
                    </Alert>

                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error Alert</AlertTitle>
                      <AlertDescription>
                        This is a destructive alert indicating an error or warning.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                  <CardFooter>
                    <CodeBlock code={`<Alert variant="destructive">\n  <AlertCircle className="h-4 w-4" />\n  <AlertTitle>Error</AlertTitle>\n  <AlertDescription>Something went wrong</AlertDescription>\n</Alert>`} />
                  </CardFooter>
                </Card>
              </ComponentSection>

              {/* Cards */}
              <ComponentSection 
                title="Cards" 
                description="Container components for grouping related content"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Card Example</CardTitle>
                    <CardDescription>Cards can contain headers, content, and footers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      This is the card content area. It can contain any elements like text, forms, images, or other components.
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">Cancel</Button>
                    <Button>Submit</Button>
                  </CardFooter>
                </Card>
                <div className="mt-4">
                  <CodeBlock code={`<Card>\n  <CardHeader>\n    <CardTitle>Title</CardTitle>\n    <CardDescription>Description</CardDescription>\n  </CardHeader>\n  <CardContent>Content here</CardContent>\n  <CardFooter>Footer actions</CardFooter>\n</Card>`} />
                </div>
              </ComponentSection>

              {/* Form Elements */}
              <ComponentSection 
                title="Form Elements" 
                description="Input components for user data entry"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Form Components</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="input-demo">Text Input</Label>
                      <Input id="input-demo" placeholder="Enter text here..." />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox id="checkbox-demo" />
                      <Label htmlFor="checkbox-demo">Checkbox option</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch id="switch-demo" />
                      <Label htmlFor="switch-demo">Switch toggle</Label>
                    </div>

                    <div className="space-y-2">
                      <Label>Progress Bar</Label>
                      <Progress value={progress} className="w-full" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>-</Button>
                        <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>+</Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Slider</Label>
                      <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
                      <p className="text-sm text-muted-foreground">Value: {sliderValue[0]}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <CodeBlock code={`<Input placeholder="Text input" />\n<Checkbox id="check" />\n<Switch id="toggle" />\n<Progress value={50} />\n<Slider value={[50]} max={100} />`} />
                  </CardFooter>
                </Card>
              </ComponentSection>

              {/* Accordion */}
              <ComponentSection 
                title="Accordion" 
                description="Collapsible content panels"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Accordion Example</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>Section 1</AccordionTrigger>
                        <AccordionContent>
                          This is the content of section 1. It can contain any elements.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger>Section 2</AccordionTrigger>
                        <AccordionContent>
                          This is the content of section 2 with more information.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3">
                        <AccordionTrigger>Section 3</AccordionTrigger>
                        <AccordionContent>
                          This is the content of section 3.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                  <CardFooter>
                    <CodeBlock code={`<Accordion type="single" collapsible>\n  <AccordionItem value="item-1">\n    <AccordionTrigger>Title</AccordionTrigger>\n    <AccordionContent>Content</AccordionContent>\n  </AccordionItem>\n</Accordion>`} />
                  </CardFooter>
                </Card>
              </ComponentSection>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-8">
              <ComponentSection 
                title="Color System" 
                description="Semantic color tokens used throughout the application"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Semantic Colors</CardTitle>
                    <CardDescription>All colors use HSL values from the design system</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-background border border-border"></div>
                        <p className="text-sm font-medium">background</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-foreground"></div>
                        <p className="text-sm font-medium">foreground</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-primary"></div>
                        <p className="text-sm font-medium">primary</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-secondary"></div>
                        <p className="text-sm font-medium">secondary</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-accent"></div>
                        <p className="text-sm font-medium">accent</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-muted"></div>
                        <p className="text-sm font-medium">muted</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-destructive"></div>
                        <p className="text-sm font-medium">destructive</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-card border border-border"></div>
                        <p className="text-sm font-medium">card</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <CodeBlock code={`/* Use semantic tokens */\nclassName="bg-primary text-primary-foreground"\nclassName="bg-secondary text-secondary-foreground"\nclassName="border-border"`} />
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Gradients</CardTitle>
                    <CardDescription>Pre-defined gradient patterns</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="h-20 rounded-lg" style={{ background: "var(--gradient-primary)" }}></div>
                        <p className="text-sm font-medium">gradient-primary</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-20 rounded-lg" style={{ background: "var(--gradient-accent)" }}></div>
                        <p className="text-sm font-medium">gradient-accent</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-20 rounded-lg" style={{ background: "var(--gradient-warm)" }}></div>
                        <p className="text-sm font-medium">gradient-warm</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-20 rounded-lg" style={{ background: "var(--gradient-reward)" }}></div>
                        <p className="text-sm font-medium">gradient-reward</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ComponentSection>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-8">
              <ComponentSection 
                title="Typography" 
                description="Text styles and hierarchy"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Headings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h1 className="text-5xl font-extrabold">Heading 1</h1>
                      <CodeBlock code={`<h1 className="text-5xl font-extrabold">Heading 1</h1>`} />
                    </div>
                    <Separator />
                    <div>
                      <h2 className="text-4xl font-bold">Heading 2</h2>
                      <CodeBlock code={`<h2 className="text-4xl font-bold">Heading 2</h2>`} />
                    </div>
                    <Separator />
                    <div>
                      <h3 className="text-3xl font-bold">Heading 3</h3>
                      <CodeBlock code={`<h3 className="text-3xl font-bold">Heading 3</h3>`} />
                    </div>
                    <Separator />
                    <div>
                      <h4 className="text-2xl font-bold">Heading 4</h4>
                      <CodeBlock code={`<h4 className="text-2xl font-bold">Heading 4</h4>`} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Body Text</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-base">Regular body text - Default size for content</p>
                      <CodeBlock code={`<p className="text-base">Body text</p>`} />
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Small muted text - For secondary information</p>
                      <CodeBlock code={`<p className="text-sm text-muted-foreground">Muted text</p>`} />
                    </div>
                    <Separator />
                    <div>
                      <p className="text-lg font-medium">Large emphasized text - For important content</p>
                      <CodeBlock code={`<p className="text-lg font-medium">Emphasized text</p>`} />
                    </div>
                  </CardContent>
                </Card>
              </ComponentSection>
            </TabsContent>
          </Tabs>

          {/* Usage Guidelines */}
          <div className="mt-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">Usage Guidelines</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>✓ Do</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• Use semantic color tokens (bg-primary, text-foreground)</p>
                  <p>• Follow the size hierarchy (sm, default, lg)</p>
                  <p>• Use appropriate variants for context</p>
                  <p>• Maintain consistent spacing with Tailwind utilities</p>
                  <p>• Add proper ARIA labels for accessibility</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>✗ Don't</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• Don't use hardcoded colors (bg-red-500, text-blue-600)</p>
                  <p>• Don't mix button styles inconsistently</p>
                  <p>• Don't skip semantic HTML elements</p>
                  <p>• Don't forget responsive design considerations</p>
                  <p>• Don't ignore keyboard navigation</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default StyleGuide;
