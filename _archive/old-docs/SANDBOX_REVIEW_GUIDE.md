# 🎯 Complete Platform Sandbox Review Guide

## ✅ Platform Status: READY FOR REVIEW

The complete RYD platform is now running in the sandbox for your review and approval before going live.

---

## 🌐 Access the Sandbox

**URL:** http://localhost:3002

The browser should open automatically. If not, manually navigate to the URL above.

---

## 🔍 Complete Feature Checklist

Use this checklist to verify all features are working correctly:

### ✅ Homepage Features

- [ ] **Header** - "Ride Your Demons" title with "Tour" button
- [ ] **Search Bar** - Centered "Search for Help" section
- [ ] **Tool of the Day** - Rotating tool card (changes daily)
- [ ] **Footer** - Legal disclaimers visible
- [ ] **Responsive Design** - Works on mobile and desktop

### ✅ Search Functionality

1. [ ] Type "depression" in search bar → Shows pain point page
2. [ ] Type "anxiety" → Shows anxiety pain point page
3. [ ] Type "stress" → Shows stress pain point page
4. [ ] Autocomplete suggestions appear while typing

### ✅ Pain Point Pages

When you search and select a pain point, verify:

- [ ] **Gate Header** - Shows category (e.g., "Emotional Health")
- [ ] **Breadcrumb** - Shows: Home > Gate > Pain Point
- [ ] **Pain Point Title & Description**
- [ ] **Three Tools Section** - All 3 tools displayed
- [ ] **Related Challenges** - Links to other pain points
- [ ] **Research & Evidence** - Citations displayed
- [ ] **Matrix Loop** - "Continue Your Journey" section at bottom

### ✅ Tool Workthroughs

1. [ ] Click "Start Tool" on any tool
2. [ ] Verify tool workthrough page displays
3. [ ] Check **Research Citations Section** at bottom:
   - [ ] Shows "How It Works" (mechanism)
   - [ ] Shows "Why It Works" (evidence)
   - [ ] Shows Key Findings (when available)
   - [ ] Links to research papers work
4. [ ] Click "← Back" → Returns to pain point page

### ✅ Tool of the Day

- [ ] Click "Try This Tool" → Opens tool workthrough
- [ ] Tool rotates daily (test by refreshing)

### ✅ Matrix Structure

Verify the complete matrix flow:

1. **Search** → Entry point
2. **Gate** → Categorization layer
3. **Pain Point** → Specific challenge
4. **Three Tools** → Self-help workthroughs
5. **Research Citations** → Real-world evidence
6. **Matrix Loop** → Links back to RYD

### ✅ Navigation & Links

- [ ] Breadcrumb navigation works (Home links back)
- [ ] Related pain points are clickable
- [ ] "Continue Your Journey" links work
- [ ] All back buttons function correctly
- [ ] Links to research papers open in new tabs

### ✅ SEO & Technical

- [ ] Page title updates based on content
- [ ] Meta descriptions present
- [ ] Open Graph tags present
- [ ] Schema.org structured data present
- [ ] Mobile-friendly (responsive design)

### ✅ Styling & UX

- [ ] Clean, minimal design (white background, neutral colors)
- [ ] All text readable (proper contrast)
- [ ] Buttons are clickable and styled
- [ ] Cards and sections properly formatted
- [ ] No purple gradients or decorative elements
- [ ] Matches live site aesthetic

---

## 🧪 Testing Scenarios

### Scenario 1: Search Flow
1. Start at homepage
2. Search for "depression"
3. Click on depression result
4. View all 3 tools
5. Click "Start Tool" on first tool
6. Read tool workthrough
7. Check research citations
8. Go back to pain point page
9. Click "Related Challenge"
10. Verify matrix loop continues

### Scenario 2: Tool of the Day
1. View Tool of the Day on homepage
2. Click "Try This Tool"
3. Complete tool workthrough
4. Check research citations
5. Navigate back to homepage

### Scenario 3: Mobile Responsiveness
1. Resize browser window to mobile size
2. Verify search bar works
3. Verify pain point pages display correctly
4. Verify tool workthroughs are readable
5. Verify all buttons are touch-friendly

---

## ✅ Approval Checklist

Before approving for live deployment, verify:

- [ ] All features working as expected
- [ ] No JavaScript errors in console (F12)
- [ ] All links functional
- [ ] Research citations present and accurate
- [ ] Legal disclaimers visible
- [ ] Mobile responsive
- [ ] Styling matches live site
- [ ] SEO tags present
- [ ] Matrix structure complete

---

## 🚀 Next Steps After Approval

Once you approve the sandbox:

1. **Document any requested changes**
2. **Deploy to staging** (if available)
3. **Final review on staging**
4. **Deploy to production**

---

## 📝 Notes

- Server runs on port 3002
- All data is mock data (replace with Firebase in production)
- All research citations are real references
- Platform is fully functional for testing

---

**Ready to review?** Go to: http://localhost:3002

