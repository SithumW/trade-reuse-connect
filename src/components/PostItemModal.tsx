import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCreateItem } from '@/hooks/useItems';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Upload, 
  X, 
  MapPin, 
  Image as ImageIcon,
  Loader2,
  AlertCircle 
} from 'lucide-react';

interface PostItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const categories = [
  'Electronics', 
  'Furniture', 
  'Clothing', 
  'Books', 
  'Sports & Fitness', 
  'Home & Garden', 
  'Toys & Games',
  'Automotive',
  'Musical Instruments',
  'Art & Crafts'
];

const conditions = [
  { value: 'NEW', label: 'New - Never used' },
  { value: 'GOOD', label: 'Good - Minor wear' },
  { value: 'FAIR', label: 'Fair - Visible wear' },
  { value: 'POOR', label: 'Poor - Heavy wear' }
];

export const PostItemModal: React.FC<PostItemModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const { user } = useAuth();
  const createItemMutation = useCreateItem();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    latitude: '',
    longitude: '',
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSubmitting = createItemMutation.isPending;

  // Handle form field changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const file of files) {
      // Check file type
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/i)) {
        toast.error(`${file.name} is not a valid image format`);
        continue;
      }

      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        continue;
      }

      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setImages(prev => [...prev, ...validFiles]);
    setImagePreviews(prev => [...prev, ...validPreviews]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    toast.info('Getting your location...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6)
        }));
        toast.success('Location set successfully');
      },
      (error) => {
        console.error('Geolocation error:', error);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location access denied. Please enable location permissions.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            toast.error('Location request timed out. Please try again.');
            break;
          default:
            toast.error('Failed to get your location. Please enter manually.');
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3 || formData.title.length > 100) {
      newErrors.title = 'Title must be 3-100 characters long';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10 || formData.description.length > 1000) {
      newErrors.description = 'Description must be 10-1000 characters long';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.condition) {
      newErrors.condition = 'Condition is required';
    }

    if (formData.latitude && (isNaN(Number(formData.latitude)) || Number(formData.latitude) < -90 || Number(formData.latitude) > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }

    if (formData.longitude && (isNaN(Number(formData.longitude)) || Number(formData.longitude) < -180 || Number(formData.longitude) > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to post items');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors and try again');
      return;
    }

    try {
      const submitData = new FormData();
      
      // Add text fields
      submitData.append('title', formData.title.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('category', formData.category);
      submitData.append('condition', formData.condition);
      
      // Add location if provided
      if (formData.latitude && formData.longitude) {
        submitData.append('latitude', formData.latitude);
        submitData.append('longitude', formData.longitude);
      }

      // Add images
      images.forEach((image) => {
        submitData.append('images', image);
      });

      await createItemMutation.mutateAsync(submitData);
      
      resetForm();
      onClose();
      onSuccess?.();

    } catch (error: any) {
      console.error('Failed to post item:', error);
      // Error toast is already handled by the mutation
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      condition: '',
      latitude: '',
      longitude: '',
    });
    setImages([]);
    // Cleanup image previews
    imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    setImagePreviews([]);
    setErrors({});
  };

  // Handle modal close
  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post New Item</DialogTitle>
          <DialogDescription>
            Share an item you'd like to trade with the community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="What are you offering?"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              disabled={isSubmitting}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                {errors.title}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your item in detail (minimum 10 characters)..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isSubmitting}
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formData.description.length}/1000 characters</span>
              {errors.description && (
                <div className="flex items-center gap-1 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {errors.description}
                </div>
              )}
            </div>
          </div>

          {/* Category & Condition Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange('category', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.category}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">
                Condition <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.condition} 
                onValueChange={(value) => handleInputChange('condition', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className={errors.condition ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map(condition => (
                    <SelectItem key={condition.value} value={condition.value}>
                      {condition.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.condition && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.condition}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location (Optional)</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={isSubmitting}
                className="shrink-0"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Use My Location
              </Button>
              <div className="grid grid-cols-2 gap-2 flex-1">
                <div>
                  <Input
                    placeholder="Latitude"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    disabled={isSubmitting}
                    className={errors.latitude ? 'border-red-500' : ''}
                  />
                  {errors.latitude && (
                    <div className="text-red-500 text-xs mt-1">{errors.latitude}</div>
                  )}
                </div>
                <div>
                  <Input
                    placeholder="Longitude"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    disabled={isSubmitting}
                    className={errors.longitude ? 'border-red-500' : ''}
                  />
                  {errors.longitude && (
                    <div className="text-red-500 text-xs mt-1">{errors.longitude}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Images (Optional - Max 5)</Label>
            <div className="space-y-4">
              {/* Upload Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || images.length >= 5}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Images ({images.length}/5)
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <Card key={index} className="relative">
                      <CardContent className="p-0">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(index)}
                          disabled={isSubmitting}
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {images.length === 0 && (
                <Card className="border-dashed border-2 border-muted-foreground/25">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No images selected. Click "Upload Images" to add photos.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Item'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
