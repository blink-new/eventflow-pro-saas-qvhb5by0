import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, DatabaseService } from '../lib/blink'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Calendar } from '../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { useToast } from '../hooks/use-toast'
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  DollarSign,
  Sparkles,
  CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '../lib/utils'

interface EventCreationProps {
  user: User
}

interface EventFormData {
  title: string
  description: string
  eventType: string
  startDate: Date | undefined
  endDate: Date | undefined
  venueName: string
  venueAddress: string
  maxCapacity: string
  budgetTotal: string
}

const eventTypes = [
  { value: 'conference', label: 'Conference', icon: '🎤', description: 'Professional conferences and seminars' },
  { value: 'wedding', label: 'Wedding', icon: '💒', description: 'Wedding ceremonies and receptions' },
  { value: 'festival', label: 'Festival', icon: '🎪', description: 'Music festivals and cultural events' },
  { value: 'corporate', label: 'Corporate', icon: '🏢', description: 'Corporate meetings and team events' },
  { value: 'concert', label: 'Concert', icon: '🎵', description: 'Musical performances and shows' },
  { value: 'workshop', label: 'Workshop', icon: '🛠️', description: 'Educational workshops and training' },
  { value: 'other', label: 'Other', icon: '📅', description: 'Custom event type' }
]

export default function EventCreation({ user }: EventCreationProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    eventType: '',
    startDate: undefined,
    endDate: undefined,
    venueName: '',
    venueAddress: '',
    maxCapacity: '',
    budgetTotal: ''
  })

  const handleInputChange = (field: keyof EventFormData, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.eventType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const eventData = {
        userId: user.id,
        title: formData.title,
        description: formData.description,
        eventType: formData.eventType as any,
        startDate: formData.startDate?.toISOString(),
        endDate: formData.endDate?.toISOString(),
        venueName: formData.venueName,
        venueAddress: formData.venueAddress,
        maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity) : undefined,
        budgetTotal: formData.budgetTotal ? parseFloat(formData.budgetTotal) : 0,
        budgetSpent: 0,
        ticketSalesTotal: 0,
        isPublic: false,
        status: 'planning' as const
      }

      const event = await DatabaseService.createEvent(eventData)
      
      toast({
        title: "Event Created!",
        description: "Your event has been created successfully.",
      })
      
      navigate(`/event/${event.id}`)
    } catch (error) {
      console.error('Error creating event:', error)
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep === 1 && (!formData.title || !formData.eventType)) {
      toast({
        title: "Missing Information",
        description: "Please fill in the event title and type.",
        variant: "destructive"
      })
      return
    }
    setCurrentStep(prev => Math.min(prev + 1, 3))
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Create New Event</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step <= currentStep 
                    ? "bg-indigo-600 text-white" 
                    : "bg-gray-200 text-gray-600"
                )}>
                  {step < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div className={cn(
                    "w-24 h-1 mx-4",
                    step < currentStep ? "bg-indigo-600" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Basic Info</span>
            <span>Details</span>
            <span>Review</span>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
                Let's start with the basics
              </CardTitle>
              <CardDescription>
                Tell us about your event and we'll help you plan everything else.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Annual Tech Conference 2024"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your event, its purpose, and what attendees can expect..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div>
                <Label>Event Type *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {eventTypes.map((type) => (
                    <div
                      key={type.value}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50",
                        formData.eventType === type.value
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200"
                      )}
                      onClick={() => handleInputChange('eventType', type.value)}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div>
                          <h3 className="font-medium text-gray-900">{type.label}</h3>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Event Details */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-indigo-600" />
                Event Details
              </CardTitle>
              <CardDescription>
                When and where will your event take place?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !formData.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => handleInputChange('startDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !formData.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => handleInputChange('endDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="venueName">Venue Name</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="venueName"
                    placeholder="e.g., Grand Convention Center"
                    value={formData.venueName}
                    onChange={(e) => handleInputChange('venueName', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="venueAddress">Venue Address</Label>
                <Input
                  id="venueAddress"
                  placeholder="Full address including city, state, and zip code"
                  value={formData.venueAddress}
                  onChange={(e) => handleInputChange('venueAddress', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxCapacity">Maximum Capacity</Label>
                  <div className="relative mt-1">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="maxCapacity"
                      type="number"
                      placeholder="e.g., 500"
                      value={formData.maxCapacity}
                      onChange={(e) => handleInputChange('maxCapacity', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="budgetTotal">Total Budget</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="budgetTotal"
                      type="number"
                      placeholder="e.g., 50000"
                      value={formData.budgetTotal}
                      onChange={(e) => handleInputChange('budgetTotal', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-indigo-600" />
                Review Your Event
              </CardTitle>
              <CardDescription>
                Please review the information before creating your event.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Event Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Title:</span> {formData.title}</div>
                    <div><span className="font-medium">Type:</span> {eventTypes.find(t => t.value === formData.eventType)?.label}</div>
                    {formData.description && (
                      <div><span className="font-medium">Description:</span> {formData.description}</div>
                    )}
                  </div>
                </div>

                {(formData.startDate || formData.endDate || formData.venueName) && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Event Details</h3>
                    <div className="space-y-2 text-sm">
                      {formData.startDate && (
                        <div><span className="font-medium">Start Date:</span> {format(formData.startDate, "PPP")}</div>
                      )}
                      {formData.endDate && (
                        <div><span className="font-medium">End Date:</span> {format(formData.endDate, "PPP")}</div>
                      )}
                      {formData.venueName && (
                        <div><span className="font-medium">Venue:</span> {formData.venueName}</div>
                      )}
                      {formData.venueAddress && (
                        <div><span className="font-medium">Address:</span> {formData.venueAddress}</div>
                      )}
                      {formData.maxCapacity && (
                        <div><span className="font-medium">Capacity:</span> {formData.maxCapacity} people</div>
                      )}
                      {formData.budgetTotal && (
                        <div><span className="font-medium">Budget:</span> ${parseFloat(formData.budgetTotal).toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep < 3 ? (
            <Button onClick={nextStep} className="bg-indigo-600 hover:bg-indigo-700">
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}