# Projects Module Documentation

## Overview
The Projects module is a comprehensive real estate project management system integrated into the multi-tenant SaaS platform. It allows organizations to create, manage, and track real estate projects with detailed property information, location data, pricing, and media.

---

## Features

### ✅ CRUD Operations
- **Create** - Add new projects with comprehensive details
- **Read** - View all projects in a beautiful grid layout
- **Update** - Edit project details with a rich form interface
- **Delete** - Remove projects with confirmation (includes automatic image cleanup)

### 🎨 Visual Enhancements
- **Icons** - Comprehensive icon usage from lucide-react
- **Property Type Indicators** - Visual icons for residential, commercial, and land
- **Transaction Badges** - Color-coded badges (Sell, Rent, Lease, PG)
- **Gradient Backgrounds** - Modern gradient designs throughout
- **Hover Effects** - Smooth transitions and shadows on cards
- **Empty States** - Beautiful placeholder when no projects exist
- **Success/Error Alerts** - User-friendly notifications

### 📸 Image Management
- **Upload** - Direct upload to Supabase Storage
- **Preview** - Real-time image preview
- **Auto-delete** - Old images removed when replaced
- **Validation** - Image-only file type checking

### 📋 Form Organization
- **Tabbed Interface** - Organized into 4 sections:
  1. **Basic Info** - Name, address, description, image
  2. **Property** - Transaction type, category, property details
  3. **Location** - City, locality, landmark
  4. **Pricing** - Min/max price range with formatted display

---

## Database Schema

### Projects Table
Located in Supabase PostgreSQL database.

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  image_path TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE,
  address TEXT,
  project_type TEXT,
  metadata JSONB,  -- Contains real_estate data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Metadata Structure (JSONB)
The `metadata` field contains a `real_estate` object validated against the JSON Schema:

```json
{
  "real_estate": {
    "transaction": "sell|rent|lease|pg",
    "property": {
      "category": "residential|commercial|land",
      "use_case": "apartment|builder_floor|independent_house|...",
      "residential": {
        "bhk": "1rk|1bhk|2bhk|3bhk|4bhk|5plus",
        "carpet_area": 1200,
        "built_up_area": 1400,
        "super_built_up_area": 1600
      },
      "commercial": {
        "area": 2000,
        "built_up_area": 2200,
        "ground_floor": true
      },
      "land": {
        "plot_area": 5000
      }
    },
    "location": {
      "city": "Mumbai",
      "locality": "Andheri West",
      "landmark": "Near Metro Station"
    },
    "pricing": {
      "min": 5000000,
      "max": 8000000
    },
    "media": {
      "thumbnail": "https://..."
    },
    "description": "Detailed project description..."
  }
}
```

---

## API Endpoints

### GET /api/projects
Fetch all projects for the authenticated user's organization.

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Sunrise Apartments",
      "description": "...",
      "image_url": "https://...",
      "address": "123 Main St",
      "metadata": { "real_estate": {...} },
      "created_at": "2025-01-03T10:00:00Z",
      "updated_at": "2025-01-03T10:00:00Z"
    }
  ]
}
```

### POST /api/projects
Create a new project.

**Request Body:**
```json
{
  "name": "Sunrise Apartments",
  "description": "Luxury residential project...",
  "address": "123 Main Street",
  "image_url": "https://...",
  "image_path": "projects/org-id/image.jpg",
  "real_estate": {
    "transaction": "sell",
    "property": {
      "category": "residential",
      "use_case": "apartment",
      "residential": {
        "bhk": "3bhk",
        "carpet_area": 1200,
        "built_up_area": 1400,
        "super_built_up_area": 1600
      }
    },
    "location": {
      "city": "Mumbai",
      "locality": "Andheri West",
      "landmark": "Near Metro"
    },
    "pricing": {
      "min": 5000000,
      "max": 8000000
    },
    "media": {
      "thumbnail": "https://..."
    },
    "description": "..."
  }
}
```

### PUT /api/projects/:id
Update an existing project.

**Request Body:** Same as POST

### DELETE /api/projects/:id
Delete a project and its associated image from storage.

### POST /api/projects/upload-url
Get a signed upload URL for image upload to Supabase Storage.

**Request Body:**
```json
{
  "fileName": "image.jpg",
  "contentType": "image/jpeg"
}
```

**Response:**
```json
{
  "uploadUrl": "https://...signed-url...",
  "image_url": "https://...public-url...",
  "image_path": "projects/org-id/uuid.jpg"
}
```

---

## Schema Validation

Projects use JSON Schema validation for the `real_estate` data structure.

**Schema File:** `/app/lib/schemas/realEstateProperty.schema.json`

### Validation Rules:
- **Required fields:** transaction, property, location, pricing, media, description
- **Property category-specific fields:**
  - **Residential:** Must include `residential` object with bhk, carpet_area
  - **Commercial:** Must include `commercial` object with area/built_up_area
  - **Land:** Must include `land` object with plot_area
- **Location:** city and locality are required
- **Pricing:** min and max values required
- **Description:** Minimum 50 characters

---

## UI Components

### Property Category Icons
```jsx
<PropertyCategoryIcon category="residential" />  // Home icon
<PropertyCategoryIcon category="commercial" />   // Store icon
<PropertyCategoryIcon category="land" />         // LandPlot icon
```

### Transaction Badges
```jsx
<TransactionBadge transaction="sell" />   // Blue badge
<TransactionBadge transaction="rent" />   // Green badge
<TransactionBadge transaction="lease" />  // Purple badge
<TransactionBadge transaction="pg" />     // Orange badge
```

### Icon Usage Throughout
- 🏢 Building2 - Main header, project type
- 🏠 Home - Residential properties, BHK
- 🏪 Store - Commercial properties
- 🌍 LandPlot - Land properties
- 📍 MapPin - Location information
- 💰 DollarSign - Pricing
- 📅 Calendar - Dates
- ✏️ Edit - Edit button
- 🗑️ Trash2 - Delete button
- 👁️ Eye - View button
- 📤 Upload - Image upload
- ➕ Plus - Create new
- ✨ Sparkles - Special features
- 🖼️ Image - Placeholder
- 💼 Briefcase - Campaigns
- 📊 TrendingUp - Analytics
- 📏 Ruler - Area measurements
- 📚 Layers - Sections
- ✅ CheckCircle2 - Success states

---

## Permission System

The Projects module integrates with the platform's role-based permission system:

**Features:**
- `project.create` - Create new projects
- `project.edit` - Edit existing projects
- `project.view` - View projects
- `project.delete` - Delete projects (implicitly checked via edit permission)

**Access Control:**
- Projects are scoped to organizations
- Users can only see projects from their organization
- Platform admins can access all projects
- Project creators (owners) have implicit edit/delete rights

---

## Integration with Campaigns

Projects can have associated campaigns. Each project card includes:
- **"Add Campaign" button** - Creates a new campaign linked to the project
- Campaign fields: name, description, start/end dates, time windows

---

## File Structure

```
/app/
├── app/
│   ├── dashboard/
│   │   └── projects/
│   │       └── page.js              # Main projects page with UI
│   └── api/
│       └── projects/
│           ├── route.js             # GET, POST endpoints
│           ├── [id]/
│           │   └── route.js         # GET, PUT, DELETE by ID
│           └── upload-url/
│               └── route.js         # Image upload URL generation
├── lib/
│   └── schemas/
│       └── realEstateProperty.schema.json  # JSON Schema validation
├── database/
│   └── CREATE_PROJECTS_TABLE.sql   # Table creation script
└── PROJECTS_DOCUMENTATION.md       # This file
```

---

## Styling & Design

### Color Scheme
- **Primary:** Blue to Indigo gradient (`from-blue-600 to-indigo-600`)
- **Background:** Subtle gradient (`from-slate-50 via-blue-50/30 to-slate-50`)
- **Cards:** White with shadow, hover effects
- **Badges:** Category-specific colors (blue, green, purple, orange)

### Responsive Design
- **Grid Layout:** 1 column (mobile), 2 (tablet), 3 (desktop)
- **Card Height:** Fixed image height (192px) with responsive text
- **Forms:** Stack on mobile, grid on desktop

### Animations
- Card hover: Scale transform + shadow increase
- Image hover: Scale 105%
- Button hover: Gradient shift
- Smooth transitions (300ms)

---

## Best Practices

### Creating Projects
1. Fill in all required fields (marked with *)
2. Minimum 50 characters for description
3. Upload a representative image
4. Specify accurate location details
5. Set realistic price ranges

### Editing Projects
1. Use the Edit button on project cards
2. Modal opens with pre-filled data
3. Update any fields as needed
4. Images are automatically replaced (old ones deleted)

### Deleting Projects
1. Confirmation required
2. Cascades to associated campaigns
3. Images automatically removed from storage
4. Action logged in audit trail

---

## Future Enhancements

Potential improvements for future versions:
- [ ] Bulk operations (multi-select delete)
- [ ] Advanced filtering (by category, price range, location)
- [ ] Sorting options (by date, price, name)
- [ ] Search functionality
- [ ] Project templates
- [ ] PDF export
- [ ] Share projects externally
- [ ] Project analytics dashboard
- [ ] Gallery view with multiple images
- [ ] Map integration for location
- [ ] Favorite/bookmark projects

---

## Troubleshooting

### Images not uploading
- Check Supabase Storage bucket `project-images` exists
- Verify storage permissions (public read access)
- Ensure file size is under Supabase limits

### Validation errors
- Check description length (minimum 50 characters)
- Ensure all required location fields are filled
- Verify price values are numbers
- Match property category with appropriate details (residential/commercial/land)

### Projects not appearing
- Verify user is authenticated
- Check organization_id is set in profile
- Ensure RLS policies allow access
- Check browser console for errors

---

## Support

For issues or questions:
1. Check browser console for errors
2. Review backend logs: `tail -f /var/log/supervisor/nextjs.out.log`
3. Verify database schema matches documentation
4. Check Supabase dashboard for data integrity

---

**Last Updated:** January 3, 2025
**Version:** 2.0 (Enhanced UI)
