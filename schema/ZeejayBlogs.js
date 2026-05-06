const mongoose = require('mongoose');
const { Schema } = mongoose;

const faqSchema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
}, { _id: false }); // _id is usually unnecessary for small sub-documents like FAQs

const articleSchema = new Schema({
  // External or legacy ID from the event source
  externalId: { 
    type: Number, 
    unique: true, 
    required: true 
  },
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },
  published_url: String,
  metaDescription: String,
  
  // Content stored in multiple formats
  content_html: String,
  content_markdown: String,
  
  // Media
  heroImageUrl: String,
  heroImageAlt: String,
  infographicImageUrl: String,
  
  // Taxonomy & SEO
  keywords: [String],        // Array of strings for easy querying
  metaKeywords: String,      // Raw string if needed for legacy SEO
  wordpressTags: String,     // Raw string from WP export
  
  // Structured Data
  faqSchema: [faqSchema],    // Nested array of FAQ objects
  
  // Metadata
  languageCode: { 
    type: String, 
    default: 'en' 
  },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'published' 
  },
  
  // Timestamps
  publishedAt: Date,
  updatedAt: Date,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  // Automatically manages 'createdAt' and 'updatedAt' fields for the DB record
  timestamps: true 
});

// Indexing for performance
articleSchema.index({ slug: 1 });
articleSchema.index({ keywords: 1 });

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;