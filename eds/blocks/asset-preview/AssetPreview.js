/* eslint-disable no-underscore-dangle */
import { CAAS_TAGS_URL, getLibs, prodHosts } from '../../scripts/utils.js';
import {
  PARTNERS_PROD_DOMAIN,
  PARTNERS_STAGE_DOMAIN,
  transformCardUrl,
} from '../utils/utils.js';
import {
  DEFAULT_BACKGROUND_IMAGE_PATH,
  DIGITALEXPERIENCE_PREVIEW_PATH, FILE_EXTENSION_TO_DOWNLOAD_LABEL,
  PARTNER_LEVEL, PX_ASSETS_PREVIEW_PATH,
} from '../utils/dxConstants.js';

import DOMPurify from '../../libs/deps/purify-wrapper.js';


const ayoL = [
    {
      "title": "Welcome And Speaker Introductions",
      "summary": "Natalie Niehoff welcomes attendees to the AJO Loyalty Go-To-Market Launch webinar and introduces Tyler Hogan, Kira Fawcett, and Daniel Vivas from the product marketing and management teams.",
      "timerange": "00:00:01.001 - 00:01:31.625"
    },
    {
      "title": "Agenda And Session Goals",
      "summary": "Tyler outlines the agenda covering product overview, demo, use cases, and FAQs, aiming for partners to confidently discuss Adobe's loyalty strategy and value with customers.",
      "timerange": "00:01:31.625 - 00:02:22.906"
    },
    {
      "title": "Why Partners Should Be Excited",
      "summary": "Tyler explains the market shift driven by rising acquisition costs and AI disruption, introduces the loyalty leader persona, and highlights AJO Loyalty as a standalone offering with strong market demand.",
      "timerange": "00:02:22.906 - 00:05:22.223"
    },
    {
      "title": "Market Headwinds And Loyalty Importance",
      "summary": "Discussion of Gartner and Bain data showing declining organic search, rising acquisition costs, and 78% of retail executives believing generative AI will weaken brand loyalty, positioning loyalty as a strategic asset.",
      "timerange": "00:05:22.959 - 00:07:12.258"
    },
    {
      "title": "Evolution Of Loyalty Programs",
      "summary": "Tyler traces loyalty's evolution from transactional point systems through experiential gamification to the future vision of loyalty as an AI-powered growth engine capturing zero-party data.",
      "timerange": "00:07:14.346 - 00:08:53.278"
    },
    {
      "title": "Blockers To Modern Loyalty",
      "summary": "Four key blockers are outlined: fragmented data, static programs, operational silos and lag, and underutilization of AI, with 60% of loyalty spend going to manual services.",
      "timerange": "00:08:53.778 - 00:11:32.270"
    },
    {
      "title": "Current Loyalty Solution Approaches",
      "summary": "Tyler reviews three approaches brands take today: in-house solutions, pure-play loyalty management platforms, and enterprise ecosystems, identifying gaps in personalization, orchestration, and agentic AI.",
      "timerange": "00:11:33.132 - 00:13:27.365"
    },
    {
      "title": "Introducing AJO Loyalty",
      "summary": "Tyler introduces Adobe Journey Optimizer Loyalty as an AI-first orchestration app built on AEP with three core capabilities: agentic AI, personalized gamification, and unified loyalty data.",
      "timerange": "00:13:32.412 - 00:14:29.143"
    },
    {
      "title": "Agentic AI Capabilities",
      "summary": "Deep dive into always-on agentic AI that identifies high-value members, flags churn risks, recommends tactics, and measures incremental ROI tied to customer lifetime value and AOV.",
      "timerange": "00:14:30.453 - 00:15:47.013"
    },
    {
      "title": "Personalized Gamification",
      "summary": "Overview of the no-code personalized gamification capability enabling one-to-one challenges that adapt to member behavior, lifecycle stage, and preferences with cross-channel messaging orchestration.",
      "timerange": "00:15:50.194 - 00:16:53.814"
    },
    {
      "title": "Integration With Existing Loyalty Stack",
      "summary": "Tyler emphasizes AJO Loyalty complements existing loyalty infrastructure via custom integrations and connectors, with the loyalty management platform remaining the system of record while AJO orchestrates experiences.",
      "timerange": "00:16:53.814 - 00:18:45.641"
    },
    {
      "title": "Roadmap Preview By Kira",
      "summary": "Kira previews upcoming enhancements including integration with decisioning and experimentation, positioning this launch as the beginning of a broader roadmap.",
      "timerange": "00:18:49.554 - 00:19:22.525"
    },
    {
      "title": "Demo Introduction And AI Agent",
      "summary": "Kira begins the demo in AJO Loyalty, showing the insights section with anomaly detection and demonstrates coworker agent skills to create a 'Mad About Matcha' challenge via prompts.",
      "timerange": "00:19:24.051 - 00:24:51.846"
    },
    {
      "title": "Form-Based Challenge Creation",
      "summary": "Daniel walks through form-based challenge creation, showing three challenge types (standard, streak sequential, bring your own data) and reviews the general setup including AEP audiences and manual opt-in or event triggers.",
      "timerange": "00:24:52.688 - 00:29:59.923"
    },
    {
      "title": "Challenge Structure And Tasks",
      "summary": "Daniel demonstrates the structure section, creating tasks with activity types including purchase, spend, and custom events tied to AEP experience events, with SKU-level or product group eligibility.",
      "timerange": "00:30:15.493 - 00:33:31.707"
    },
    {
      "title": "Rewards Configuration",
      "summary": "Daniel explains reward setup, connecting to partner endpoints like Capillary via API to issue points upon challenge completion, with plans for multiple reward types like points and miles later in the year.",
      "timerange": "00:33:34.117 - 00:34:57.325"
    },
    {
      "title": "Content And Messaging Orchestration",
      "summary": "Daniel demonstrates content creation via AJO content cards and code-based experiences, plus messaging orchestration across six AJO channels at launch, in-progress, and end phases of the challenge.",
      "timerange": "00:34:57.325 - 00:38:15.274"
    },
    {
      "title": "Auto-Generated Journey",
      "summary": "Daniel shows how AJO Loyalty auto-generates a journey from the configured challenge, including read audience, content card, and messaging nodes, with full journey features like dry run and experimentation available.",
      "timerange": "00:38:17.711 - 00:39:40.222"
    },
    {
      "title": "Loyalty Admin Section",
      "summary": "Daniel walks through the admin section for configuring reward providers, event definitions for custom events, and product inventory uploads to simplify marketer workflows.",
      "timerange": "00:39:40.883 - 00:41:12.249"
    },
    {
      "title": "Reporting Powered By CJA",
      "summary": "Daniel explains the CJA-backed reporting section providing out-of-the-box per-challenge reports, with data available for deeper CJA analysis if customers have CJA licensed.",
      "timerange": "00:41:14.035 - 00:42:34.348"
    },
    {
      "title": "Customer Zero Case Study",
      "summary": "Daniel shares how AJO Loyalty was born from a customer needing sub-two-second challenge task delivery at fuel pumps, launching 12-14 million challenges with less than two-second latency where journeys couldn't scale.",
      "timerange": "00:42:35.543 - 00:46:36.350"
    },
    {
      "title": "Use Cases Across Verticals",
      "summary": "Tyler covers use cases including identifying high-propensity members, gamifying onboarding, driving purchase behaviors, incentivizing zero-party data capture, and personalizing reward amounts based on CLV.",
      "timerange": "00:46:36.370 - 00:49:33.298"
    },
    {
      "title": "Ideal Customers And Personas",
      "summary": "Tyler identifies top verticals (travel and hospitality, entertainment, retail, financial services) and target personas including loyalty program owners, CRM and lifecycle marketing leaders.",
      "timerange": "00:49:33.358 - 00:50:35.556"
    },
    {
      "title": "Pricing And Packaging",
      "summary": "AJO Loyalty is a new base SKU chargeable on engagement profiles, sold standalone or as add-on, with included agentic features, though not yet compatible with healthcare and privacy security shields.",
      "timerange": "00:50:35.556 - 00:52:00.840"
    },
    {
      "title": "Product Roadmap",
      "summary": "Tyler previews roadmap investments including expansion to all 14 AJO channels, decisioning and experimentation integration, coupon codes, brand concierge integration, and additional agentic skills.",
      "timerange": "00:52:01.275 - 00:54:27.977"
    },
    {
      "title": "Resources And Enablement",
      "summary": "Tyler shares available resources on Partner Experience Hub including FAQ, pitch deck, verticalized decks launching July 30th, demo hub assets, virtual tour, and Experience League documentation.",
      "timerange": "00:54:29.907 - 00:55:59.122"
    },
    {
      "title": "Q&A And Closing",
      "summary": "Team addresses questions on journey exclusion criteria and reward endpoint standards, explaining out-of-the-box connectors and homegrown system support, before Natalie closes the session.",
      "timerange": "00:56:08.820 - 00:58:11.273"
    }
  ];
const marketing = [
    {
      "title": "Welcome And Session Introduction",
      "summary": "Todd Story opens the Ready to Sell series on Journey Optimizer Email Marketing in the Era of AI, introduces Rowan Bhatt and Manish Shah, and outlines the train-the-trainer goals and deliverables.",
      "timerange": "00:00:00.069 - 00:01:48.409"
    },
    {
      "title": "Agenda And Session Flow",
      "summary": "Rowan Bhatt introduces himself and Manish, and outlines the 75-minute agenda covering market opportunity, the ESP displacement pitch walkthrough, product demo, resources, and Q&A.",
      "timerange": "00:01:48.910 - 00:02:00.015"
    },
    {
      "title": "AJO Market Opportunity And Timing",
      "summary": "Rowan explains why AJO belongs in email conversations now, citing expiring 2021-2022 ESP contracts, AI reshaping email, and the shift away from batch-and-blast models.",
      "timerange": "00:02:02.138 - 00:03:25.425"
    },
    {
      "title": "AJO Product Evolution And Forrester Recognition",
      "summary": "Rowan describes how Journey Optimizer expanded beyond real-time orchestration to full ESP capabilities, and highlights AJO's top ranking in the Q1 2026 Forrester Wave for email marketing service providers.",
      "timerange": "00:03:27.108 - 00:07:51.373"
    },
    {
      "title": "Five Platform Differentiators",
      "summary": "Rowan outlines AJO's five core differentiators: real-time data and decisioning, orchestration for every email type, AI-powered content velocity, built-in decisioning and experimentation, and agentic AI workflows.",
      "timerange": "00:07:53.556 - 00:09:29.368"
    },
    {
      "title": "AI Conversation Angles",
      "summary": "Rowan covers three ways AI shows up in email discussions: brand AI maturity levels, trust and governance with Firefly's licensed content, and the emerging AI inbox controlled by Gmail and Apple Mail.",
      "timerange": "00:09:31.021 - 00:11:10.307"
    },
    {
      "title": "Partner Opportunity In ESP Migration",
      "summary": "Rowan reframes ESP migration as organizational transformation, emphasizing partners' strategic advisory and change management role beyond implementation work in helping brands reimagine email operations.",
      "timerange": "00:11:13.188 - 00:12:53.846"
    },
    {
      "title": "Six Signals For AJO Email Deals",
      "summary": "Rowan lists six account signals indicating an AJO opportunity: approaching renewal, going beyond batch, data latency pain, Frankenstack complexity, high volume with low engagement, and leadership AI interest.",
      "timerange": "00:12:54.187 - 00:14:01.342"
    },
    {
      "title": "Pitch Deck Structure And SOAR Framework",
      "summary": "Rowan introduces the train-the-trainer pitch walkthrough using the SOAR framework—Situation, Opportunity, Approach, Results—organized around three modular pillars: workflows, optimization, and AI inbox.",
      "timerange": "00:14:03.715 - 00:16:41.420"
    },
    {
      "title": "Situation: Consumer Experience Gap",
      "summary": "The pitch opens by contrasting personalized consumer experiences with the current relevance gap in email programs, introducing the AI inbox as a fundamental reframe of the problem.",
      "timerange": "00:16:44.205 - 00:18:55.550"
    },
    {
      "title": "Email Production Dysfunction And Business Cost",
      "summary": "Rowan walks through slides showing broken email production workflows with multiple handoffs and tools, then quantifies the business cost via churn, lost revenue, and acquisition costs versus retention leaders.",
      "timerange": "00:18:58.855 - 00:20:21.143"
    },
    {
      "title": "Opportunity: Reimagining Email",
      "summary": "Rowan transitions to the opportunity framing, showing how AI inboxes reward relevance and contrasting rip-and-replace expectations with the strategic reimagine approach using AI and agentic workflows.",
      "timerange": "00:20:23.576 - 00:22:53.898"
    },
    {
      "title": "Legacy Versus Journey Optimizer Approach",
      "summary": "Rowan compares legacy channel-led, calendar-driven email strategy against AJO's experience-led, real-time, continuously optimized approach as a shorthand for what makes the platform different.",
      "timerange": "00:22:54.591 - 00:23:33.634"
    },
    {
      "title": "Approach: Three Pillars Introduction",
      "summary": "Rowan introduces the three approach pillars—work conversationally, engage intelligently, and own the AI inbox—that structure the remainder of the product pitch.",
      "timerange": "00:23:35.748 - 00:24:18.290"
    },
    {
      "title": "Workflows Pillar: Agentic AI Design",
      "summary": "Rowan explains why 85% of enterprise AI pilots fail due to bolting AI onto broken workflows, and how AJO redesigns workflows with native agentic AI using business context, memory, and governance.",
      "timerange": "00:24:20.643 - 00:25:48.252"
    },
    {
      "title": "AJO Entry Points And Agentic Journeys",
      "summary": "Three entry points into AJO are outlined: external LLMs via MCP, in-app conversational coworker chat, and the visual UI, along with agentic journey creation using natural language with human review.",
      "timerange": "00:25:50.652 - 00:27:37.116"
    },
    {
      "title": "Workflow ROI And Outcomes",
      "summary": "Rowan quantifies workflow transformation: campaigns dropping from 2-4 weeks to 2-6 hours, 70% less build time, 40% faster delivery, and 60-70% less IT dependence with one marketer per campaign.",
      "timerange": "00:27:40.233 - 00:28:42.022"
    },
    {
      "title": "AI Content Generation And Supply Chain",
      "summary": "Rowan describes AI content generation with brand alignment and quality scores, plus the composable content supply chain connecting Adobe Express, AEM Assets, and Gen Studio for Performance Marketing.",
      "timerange": "00:28:44.261 - 00:29:24.184"
    },
    {
      "title": "Real-Time Data And Audience Composition",
      "summary": "Rowan covers AJO's real-time unified customer profiles, personalization from relational data, audience composition with federated data access, and agentic audience workflows built from natural language.",
      "timerange": "00:29:27.967 - 00:29:59.122"
    },
    {
      "title": "Workflows Pillar Closing",
      "summary": "Rowan closes the workflows pillar by visualizing AJO as a unifying system across data, content, orchestration, and AI spanning acquisition through loyalty, consolidating email into one system.",
      "timerange": "00:29:30.191 - 00:30:07.270"
    },
    {
      "title": "Optimization Pillar: Real-Time Decisioning",
      "summary": "The optimization pillar begins with AJO's real-time AI-powered decisioning at moment of delivery, applying eligibility rules, frequency capping, and AI ranking for one-to-one personalization.",
      "timerange": "00:30:09.286 - 00:31:13.618"
    },
    {
      "title": "Loyalty And Experimentation",
      "summary": "Rowan introduces Journey Optimizer Loyalty for deepening engagement beyond discounting, and native A/B and multivariate testing with agentic experimentation that suggests, ranks, and summarizes tests.",
      "timerange": "00:31:14.139 - 00:32:31.550"
    },
    {
      "title": "Personalization Scope And Learning Loop",
      "summary": "Rowan details full personalization across subject lines, imagery, offers, and send time, then closes the optimization pillar with AJO as a compounding learning system with continuous in-campaign adjustment.",
      "timerange": "00:32:33.641 - 00:34:04.967"
    },
    {
      "title": "AI Inbox Pillar",
      "summary": "Rowan introduces the AI inbox concept, explaining how Gmail and Apple Mail now filter emails, and presents three AJO capabilities: AI inbox placement, AI-ready content, and AI-era measurement.",
      "timerange": "00:34:07.509 - 00:35:50.389"
    },
    {
      "title": "AI-Readable Emails And Forward Commitment",
      "summary": "Rowan highlights one-click AI-readable email versions with clean semantic text and outlines Adobe's roadmap through AI inbox placement, AI-ready content, and agentic inbox readiness.",
      "timerange": "00:35:51.158 - 00:36:39.061"
    },
    {
      "title": "Results: Validation And Customer Proof",
      "summary": "Rowan closes with Forrester and Gartner validation of AJO and its partner channel, customer proof points across verticals, and a final visualization of AJO as a single AI-powered system.",
      "timerange": "00:36:41.821 - 00:38:35.599"
    },
    {
      "title": "Demo Handoff And Friscopa Scenario Setup",
      "summary": "Manish takes over screen share and introduces the demo scenario: Friscopa, a specialty coffee brand launching new stores with a CEO mandate to go live in a week, showing how AJO's AI compresses timelines.",
      "timerange": "00:38:35.599 - 00:39:54.971"
    },
    {
      "title": "Enterprise CX Coworker Introduction",
      "summary": "Manish introduces Enterprise CX coworker as an agentic AI teammate, uploads the win-back campaign brief and whiteboard documents, and explains partner value in collapsing discovery time.",
      "timerange": "00:39:58.058 - 00:42:14.384"
    },
    {
      "title": "Audience Building With Coworker",
      "summary": "Manish uses coworker to analyze reusable audiences, generate PQL, and build a custom audience targeting dormant loyalty members within fifteen miles of new stores, demonstrating end-to-end audience creation.",
      "timerange": "00:42:14.384 - 00:46:55.377"
    },
    {
      "title": "Journey Creation Via Prompt",
      "summary": "Manish prompts coworker to build a lapsed subscriber win-back journey with channel preferences, purchase evaluation, and a content decisioning node, then saves it into Journey Optimizer.",
      "timerange": "00:47:00.283 - 00:49:23.352"
    },
    {
      "title": "Brand Setup And Assets Essentials",
      "summary": "Manish walks through AJO modules, defines brand guidelines with writing style, legal compliance, and visual standards for Friscopa, and shows Assets Essentials as a native micro-DAM with upsell potential.",
      "timerange": "00:49:23.372 - 00:53:07.991"
    },
    {
      "title": "Email Template Creation From Image",
      "summary": "Manish demonstrates converting an uploaded email template image into reusable HTML, a time-saving migration feature, and opens the email designer within a journey action.",
      "timerange": "00:53:09.372 - 00:54:45.147"
    },
    {
      "title": "Generative AI Content With Brand Alignment",
      "summary": "Manish uses generative AI with",
      "timerange": "00:55:09.372 - 01:09:54.147"
    }
  ];

const webinarRecordingBrandVisibilityPartnerE = [
    {
      "title": "Welcome And Speaker Introduction",
      "summary": "Natalie Niehoff welcomes attendees to the Adobe Brand Visibility Go-to-Market Launch webinar and introduces Karthik, who leads product marketing strategy for Adobe Brand Visibility.",
      "timerange": "00:00:00.182 - 00:00:54.165"
    },
    {
      "title": "Agenda And Customer Momentum",
      "summary": "Karthik outlines the session agenda and shares customer momentum from Tesco, GM, Merck, Revlon, and Love Sack, highlighting how the combined SEMrush and LM Optimizer capabilities are resonating in market.",
      "timerange": "00:00:55.051 - 00:03:34.333"
    },
    {
      "title": "End-To-End GEO Strategy Framework",
      "summary": "Karthik explains Adobe's end-to-end strategy for winning in GEO/AEO: discovering trending topics, tracking visibility, understanding agentic traffic, taking action across teams, and connecting to business outcomes.",
      "timerange": "00:03:35.106 - 00:06:00.559"
    },
    {
      "title": "SEMrush Acquisition Data Value",
      "summary": "Overview of SEMrush's contribution: over 300 million real AI prompts from clickstream data, plus SEO keyword and backlink data, unlocking deeper insights and optimization guidance within Adobe Brand Visibility.",
      "timerange": "00:06:01.039 - 00:07:45.668"
    },
    {
      "title": "Platform Architecture And Optimizations",
      "summary": "Karthik details how external SEMrush signals combine with agentic traffic data to power two optimization types: optimize at edge via pre-rendered pages and optimize at source via AEM Sites integration, with measurable outcomes.",
      "timerange": "00:07:47.315 - 00:10:31.075"
    },
    {
      "title": "New Features Overview",
      "summary": "Introduction to new capabilities: AI Visibility with SEMrush topic data, Prompt Strategy recommendations, Opportunity Workspace for team collaboration, and deeper measurement across eight LLMs.",
      "timerange": "00:10:34.494 - 00:16:26.988"
    },
    {
      "title": "Opportunity Workspace And Controlled Experiments",
      "summary": "Explanation of Opportunity Workspace where optimizations are treated as controlled experiments with baseline measurements and impact tracking over time to demonstrate business value.",
      "timerange": "00:15:22.569 - 00:16:26.988"
    },
    {
      "title": "Live Product Demo Introduction",
      "summary": "Karthik transitions to a live demo using play.bv.now, a public interactive environment showcasing the Adobe Brand Visibility interface for the fictitious Frescopa coffee brand.",
      "timerange": "00:16:27.892 - 00:17:40.654"
    },
    {
      "title": "AI Visibility And Prompt Research Demo",
      "summary": "Demo of Visibility Overview, Prompt Research, and Market Comparison views showing mentions, monthly audience estimates, prompt intents, and competitive comparisons against brands like Blue Bottle and Stumptown.",
      "timerange": "00:17:41.502 - 00:20:01.414"
    },
    {
      "title": "Prompt Strategy And Library Management",
      "summary": "Walkthrough of prompt strategy recommendations identifying coverage gaps and winning topics, plus the prompt library health view assessing branded/unbranded mix and agentic URL coverage.",
      "timerange": "00:20:02.235 - 00:22:21.419"
    },
    {
      "title": "Brand Presence And Brand Claims",
      "summary": "Demo of the brand presence view for tracking mentions and citations, plus the new Brand Claims feature that surfaces emerging sentiments like Frescopa being perceived as overpriced on YouTube.",
      "timerange": "00:22:23.735 - 00:23:52.506"
    },
    {
      "title": "Onsite And Offsite Opportunities",
      "summary": "Overview of onsite optimizations like recover content visibility via edge pre-rendering, and offsite recommendations for Reddit, YouTube, and Wikipedia to address third-party perception issues.",
      "timerange": "00:23:54.509 - 00:26:37.915"
    },
    {
      "title": "Opportunity Workspace Demo",
      "summary": "Demo of creating strategies, deploying optimizations, and measuring impact, showing a 72% lift in citations for espresso machines after recover content visibility optimization.",
      "timerange": "00:26:40.071 - 00:28:38.328"
    },
    {
      "title": "Agentic And Referral Traffic Analytics",
      "summary": "Explanation of agentic traffic insights from CDN logs, referral traffic from LLM citations, and bi-directional integration with Adobe Analytics and CJA to measure conversion, engagement, and revenue.",
      "timerange": "00:28:39.031 - 00:30:57.731"
    },
    {
      "title": "Roadmap: Optimize At Source",
      "summary": "Karthik previews Q4 launch of Optimize at Source with AEM Sites integration for CMS content updates and pre-flight GEO checks during authoring to proactively flag AI visibility gaps.",
      "timerange": "00:31:22.765 - 00:33:25.281"
    },
    {
      "title": "Content Freshness Capability",
      "summary": "Introduction to content freshness feature leveraging SEMrush SEO signals and query fanout analysis to identify content gaps and recommend or auto-publish new content via AEM Sites integration.",
      "timerange": "00:33:27.523 - 00:34:24.741"
    },
    {
      "title": "AIO And ABV Product Relationship",
      "summary": "Clarification that SEMrush Enterprise AIO and Adobe Brand Visibility will both exist; ABV customers get access to both products, with ABV as the feature-premium end-to-end solution.",
      "timerange": "00:34:28.154 - 00:36:38.705"
    },
    {
      "title": "Partner Opportunity Areas",
      "summary": "Karthik outlines three partner value areas: strategy and maturity assessment, optimization and activation, and measurement, plus vertical-based solutions for FSI and B2B customers.",
      "timerange": "00:36:40.828 - 00:38:31.980"
    },
    {
      "title": "Co-Sell Go-To-Market Motion",
      "summary": "Primary partner go-to-market focus for the rest of the year is co-sell motion to build pipeline, with reseller options being evaluated for FY27.",
      "timerange": "00:38:32.921 - 00:39:21.074"
    },
    {
      "title": "Trial Program Details",
      "summary": "Overview of the trial: 100 prompts, 50 optimizations, five LLMs, pre-provisioned for AEP Analytics and CJA customers, with a suggested six-week engagement partners can support to drive paid conversions.",
      "timerange": "00:40:03.354 - 00:42:35.389"
    },
    {
      "title": "Enablement Resources",
      "summary": "Karthik highlights resources including the public demo environment, Experience League documentation, what's new content, and Partner Experience Hub materials for pitching and selling Adobe Brand Visibility.",
      "timerange": "00:42:36.306 - 00:43:40.270"
    },
    {
      "title": "Q&A: Trial Optimizations And Non-AEM Sites",
      "summary": "Karthik answers questions on which optimization types are available in trial (recover content visibility) and how non-AEM sites customers can still use optimize at edge and copy-paste content recommendations.",
      "timerange": "00:44:03.325 - 00:46:06.660"
    },
    {
      "title": "Q&A: Sandbox Access And Timelines",
      "summary": "Discussion of sandbox access limited to platinum partners via trial environment, and typical optimization impact timelines of two to eight weeks with six to eight weeks as the sweet spot.",
      "timerange": "00:46:09.520 - 00:47:42.374"
    },
    {
      "title": "Q&A: Licensing And SEMrush Value",
      "summary": "Karthik explains ABV is separately licensed based on prompt volume with fair use on optimizations, and reiterates SEMrush's unique value from 300 million prompt clickstream data and SEO signals.",
      "timerange": "00:47:45.208 - 00:49:31.060"
    },
    {
      "title": "Q&A: Experience Cloud Integration And Commerce",
      "summary": "Discussion of operationalizing insights across Experience Cloud starting with Analytics/CJA, future AEP and Target integrations via CX coworker, and existing Adobe Commerce integration for PDP and catalog optimizations.",
      "timerange": "00:49:36.118 - 00:51:26.109"
    },
    {
      "title": "Q&A: Target Integration And Closing",
      "summary": "Karthik confirms no Adobe Target integration currently but it's being considered for FY27, then closes the Q&A with appreciation for the audience.",
      "timerange": "00:51:33.300 - 00:51:59.991"
    },
    {
      "title": "Next Session Preview And Wrap-Up",
      "summary": "Natalie promotes the next session on September 23rd covering the agentic brand activation sales play, thanks Karthik and partners, and closes the webinar.",
      "timerange": "00:52:14.244 - 00:53:52.901"
    }
  ];
const webinarRecordingGettingStartedAemAssetsContentHub = [
    {
      "title": "Session Introduction And Agenda",
      "summary": "The speaker introduces the session on AEM Assets and Content Hub, outlining the agenda covering context, business challenges, use cases, features, and a demo of asset ingestion, processing profiles, approvals, and Content Hub.",
      "timerange": "00:00:00.309 - 00:01:44.087"
    },
    {
      "title": "Digital Asset Management Context",
      "summary": "Discussion of drivers for digital asset management including content explosion, scaling activation, fragmented engagement, remote collaboration, speed of delivery, and compliance and governance requirements.",
      "timerange": "00:01:44.087 - 00:02:33.412"
    },
    {
      "title": "Broken Content Supply Chain Challenges",
      "summary": "Key enterprise challenges are outlined: low brand adherence, slow reviews, compliance risk, inability to find and reuse assets, duplication, permission issues, manual digital rights management, and limited performance insights.",
      "timerange": "00:02:33.412 - 00:05:56.640"
    },
    {
      "title": "How DAM Solves Content Chaos",
      "summary": "A DAM addresses issues via centralized management, consistency and control, enhanced metadata and searchability including smart tags, regulatory compliance, brand consistency, and automated workflows.",
      "timerange": "00:05:56.640 - 00:07:19.401"
    },
    {
      "title": "Single Use Case Vs Multi-Use DAM",
      "summary": "Comparison of single-use-case DAMs, which are focused and affordable but limited in scalability, versus DAMs supporting the full content supply chain with integrated workflows, governance, and scalable architecture.",
      "timerange": "00:07:19.401 - 00:10:11.950"
    },
    {
      "title": "Why Adobe AEM Assets Stands Out",
      "summary": "AEM Assets is highlighted for metadata power, variations at scale for personalization, governance, workflow automation, asset discovery, management, activation across channels, and insights that drive ROI.",
      "timerange": "00:10:11.950 - 00:12:41.117"
    },
    {
      "title": "AEM Assets User Types",
      "summary": "Three user categories are defined: power users (admins with full access), collaborator users (marketing, CMS, creative teams using Content Hub, Workfront, Asset Link), and limited users (read-only download access via Content Hub).",
      "timerange": "00:12:41.117 - 00:15:32.263"
    },
    {
      "title": "AEM Assets Product Overview",
      "summary": "Five product pillars are covered: single source of truth for content and metadata, AI-powered functions across the lifecycle, scalable acceptable usage, access for all roles based on permissions, and API-driven accessibility and automation.",
      "timerange": "00:15:32.263 - 00:17:58.035"
    },
    {
      "title": "Metadata Enrichment And Services",
      "summary": "Content Hub surfaces approved assets while ingestion triggers metadata, smart tagging, brand awareness, permissions, and content automation services to enrich assets for activation across channels.",
      "timerange": "00:17:58.035 - 00:20:54.092"
    },
    {
      "title": "Feature Highlights And Categories",
      "summary": "Core DAM features are summarized: asset repository, express editing, governance, insights, and activation tools. Three focus categories are introduced: trusted content confidence, content optimization, and quality activation at scale.",
      "timerange": "00:20:54.092 - 00:22:34.790"
    },
    {
      "title": "AI Search And Smart Tags",
      "summary": "AI Search uses natural language and ML to deliver intent-based results, reducing duplicate asset spend by 62% and agency spend by 24%. AI-generated smart tags boost discoverability with 63% cost efficiency and 80% time savings.",
      "timerange": "00:22:34.790 - 00:25:27.741"
    },
    {
      "title": "Content Optimization And Remixing",
      "summary": "Content curators can remix and republish assets with controlled creativity via Adobe Express integration and Firefly Gen AI, enabling brand-consistent self-serve editing, faster time to market, and higher asset reuse.",
      "timerange": "00:25:27.741 - 00:28:11.737"
    },
    {
      "title": "Adobe Express Integration",
      "summary": "AEM Assets integrates bidirectionally with Adobe Express, allowing users to access DAM content in Express, drag and drop into designs, save back to AEM, and maintain brand governance.",
      "timerange": "00:28:11.737 - 00:28:45.437"
    },
    {
      "title": "Dynamic Media Templates For Personalization",
      "summary": "Dynamic media templates enable millions of personalized variations on the fly through template editors and URLs, delivering one-to-one personalization at channel activation while reducing production time.",
      "timerange": "00:28:45.437 - 00:29:52.137"
    },
    {
      "title": "Content Hub Distribution",
      "summary": "Content Hub is the next-gen asset distribution experience replacing Brand Portal and Asset Share, enabling discovery, remixing, delivery, governance with attribute-based access, custom branding, and public link sharing.",
      "timerange": "00:29:52.137 - 00:32:08.992"
    },
    {
      "title": "Dynamic Media Capabilities",
      "summary": "Dynamic media delivers a single asset with on-the-fly variations, smart cropping, interactive experiences, open API access without copies, delivery insights, 30% faster performance, and brand-approved governance.",
      "timerange": "00:32:08.992 - 00:34:16.755"
    },
    {
      "title": "Demo Setup And Metadata Schemas",
      "summary": "The presenter transitions to the AEM Author instance, navigates to tools and assets, and demonstrates metadata schemas including basic, advanced, IPTC, camera raw, and commerce metadata configurations.",
      "timerange": "00:34:16.755 - 00:37:59.767"
    },
    {
      "title": "Processing Profiles Configuration",
      "summary": "Demonstration of processing profiles for custom renditions, encoding, custom business logic via asset compute services, and how profiles are applied to folders to reprocess assets.",
      "timerange": "00:37:59.767 - 00:41:15.453"
    },
    {
      "title": "Metadata Profiles And Additional Settings",
      "summary": "Overview of metadata profile customization for forms and tabs, and brief mention of image profiles, video profiles, dynamic media settings, and Asset Link configuration for connected assets.",
      "timerange": "00:41:15.453 - 00:42:08.728"
    },
    {
      "title": "Asset Ingestion Demo",
      "summary": "The presenter creates a hiking folder under demo assets and uploads four hiking images, showing the processing pipeline that applies processing profiles and creates renditions.",
      "timerange": "00:42:08.728 - 00:43:14.848"
    },
    {
      "title": "Smart Tags And Properties",
      "summary": "Demonstration of auto-generated smart tags for uploaded assets like trekking pole, hiking, and product photography, plus editing title, description, and field labels in asset properties.",
      "timerange": "00:43:14.848 - 00:47:18.792"
    },
    {
      "title": "Approving Assets For Content Hub",
      "summary": "The presenter navigates to the Portland folder under adventures, selects four assets, updates review status to approved, and shows the brand-approved assets appearing in Content Hub.",
      "timerange": "00:47:18.792 - 00:50:10.987"
    },
    {
      "title": "Creating Collections In Content Hub",
      "summary": "Approved assets are organized into a new Portland collection in Content Hub, demonstrating collection creation, adding assets, and filtering by smart tags, file format, and last modified.",
      "timerange": "00:50:10.987 - 00:52:14.696"
    },
    {
      "title": "Uploading Assets Via Content Hub",
      "summary": "Demonstration of a limited user uploading a Himalayas hiking asset through Content Hub with keywords and channels, useful for agency-approved content upload scenarios.",
      "timerange": "00:52:14.696 - 00:53:27.825"
    },
    {
      "title": "Hydrated Assets In AEM",
      "summary": "The presenter shows how Content Hub uploads appear in the hydrated assets folder within AEM Assets, where they need to be organized and moved to appropriate folders after processing.",
      "timerange": "00:53:27.825 - 00:55:07.420"
    },
    {
      "title": "Closing And Q&A",
      "summary": "The presenter concludes the session, invites questions via chat or email, and confirms that the session recording will be shared with registered attendees and their colleagues.",
      "timerange": "00:55:07.420 - 00:54:57.212"
    }
  ];
const webinarRecordingWinningProductDiscoveryAiPoweredCommerce = [
    {
      "title": "Welcome And Speaker Introduction",
      "summary": "Natalie Niehoff welcomes attendees to the partner webinar on winning product discovery with AI-powered commerce and introduces Sean McCrane from the Adobe Commerce team.",
      "timerange": "00:00:00.489 - 00:00:54.979"
    },
    {
      "title": "Opening Remarks And Icebreaker",
      "summary": "Sean introduces himself, mentions returning from PTO, and invites attendees to share their holiday experiences in the chat to make the session collaborative.",
      "timerange": "00:00:56.225 - 00:02:46.476"
    },
    {
      "title": "Agenda And Session Overview",
      "summary": "Sean outlines the agenda covering AI's transformation of product discovery, why discoverability is a critical KPI, visibility strategies across search and conversational shopping, and Adobe Commerce capabilities like semantic search.",
      "timerange": "00:02:46.476 - 00:04:25.971"
    },
    {
      "title": "Partner Opportunities In AI Discovery",
      "summary": "Sean explains how AI product discovery creates new partner conversations, with customers struggling with visibility, inconsistent data, and unknown LLM traffic patterns that partners can address.",
      "timerange": "00:04:26.031 - 00:05:15.784"
    },
    {
      "title": "Product Readiness And Data Quality",
      "summary": "Sean emphasizes the critical importance of product and data quality for AI consumption, PDP optimization, search modernization, and the need for partners to help customers with data foundations.",
      "timerange": "00:05:17.798 - 00:06:58.627"
    },
    {
      "title": "Strategy And Rapid Delivery Approach",
      "summary": "Sean discusses the services strategy buckets, the importance of thought leadership, and how AI is accelerating customer demands for quick, iterative results with early TCO and revenue proof points.",
      "timerange": "00:06:58.627 - 00:08:30.830"
    },
    {
      "title": "Adobe Commerce Capabilities Overview",
      "summary": "Sean introduces where Adobe Commerce fits with out-of-the-box capabilities like semantic search, MCP developer services, LLM discovery agents, and App Builder for partners to construct solutions.",
      "timerange": "00:08:31.600 - 00:09:45.318"
    },
    {
      "title": "AI Traffic And Consumer Behavior Data",
      "summary": "Sean shares data showing 393% increase in generative AI retail traffic, projected 50% decline in organic traffic by 2028, and shifts in B2B buying behavior driven by AI research tools.",
      "timerange": "00:09:47.330 - 00:11:36.390"
    },
    {
      "title": "Shifting Discovery Upstream",
      "summary": "Sean explains how AI discovery is moving upstream off-site, with 77% of shoppers using GenAI for research, higher conversion rates for AI referrals, and the importance of retaining acquired customers on-site.",
      "timerange": "00:11:36.390 - 00:13:51.168"
    },
    {
      "title": "Partner Opportunity Framework",
      "summary": "Sean outlines partner practices including AI commerce readiness assessments, product content data strategy, discovery and search evaluation, and catalog enrichment as key opportunity areas.",
      "timerange": "00:13:53.174 - 00:16:44.531"
    },
    {
      "title": "Catalog Agent Demo",
      "summary": "Sean demonstrates the live catalog agent that enriches product data for LLM discoverability, showing how it transforms basic descriptions into contextual narratives with governance controls to accept, decline, or edit changes.",
      "timerange": "00:16:45.012 - 00:21:16.003"
    },
    {
      "title": "AI Content Visibility Checker",
      "summary": "Sean introduces the AI Content Visibility Checker Chrome plugin that emulates how ChatGPT sees a webpage using schema.org standards, enabling before-and-after readability testing of PDPs.",
      "timerange": "00:21:16.003 - 00:23:36.242"
    },
    {
      "title": "Customer Case Study Results",
      "summary": "Sean shares an anonymized home furnishings customer example showing sustained double-digit citation rate increases from 12% to 25% after PDP optimization insertions.",
      "timerange": "00:23:36.986 - 00:26:15.948"
    },
    {
      "title": "Golden Product Record And Data Architecture",
      "summary": "Sean summarizes zero-effort product discovery for crawlers, discusses the golden record concept, PIM strategies, and the cyclical enrichment flow between PIM and commerce that creates partner opportunities.",
      "timerange": "00:26:16.409 - 00:27:55.572"
    },
    {
      "title": "Ideal Customer Fit For AI Commerce",
      "summary": "Sean identifies the sweet spot customers for Adobe Commerce as a Cloud Service, including retail, consumer goods, and industrial manufacturing with high GMV, B2B/B2C complexity, and global scale needs.",
      "timerange": "00:27:55.692 - 00:29:02.925"
    },
    {
      "title": "Common Customer Pain Points",
      "summary": "Sean outlines four common conversation openers: unattributed AI traffic, fragmented product information across systems, loss of pre-visit visibility control, and diminishing returns from SEO investment as GEO grows.",
      "timerange": "00:29:05.328 - 00:31:47.627"
    },
    {
      "title": "Partner Conversation Plays",
      "summary": "Sean maps four partner service opportunities including AI visibility assessments, catalog readiness, PDP optimization, and content strategy, emphasizing how content and commerce are more interlinked than ever.",
      "timerange": "00:31:48.334 - 00:33:33.830"
    },
    {
      "title": "Assess-Prepare-Implement-Measure Framework",
      "summary": "Sean describes a four-step play for partners: benchmark discoverability, prepare catalog and content, implement improvements, and measure relevance and conversion.",
      "timerange": "00:33:39.611 - 00:34:22.750"
    },
    {
      "title": "Semantic Search And Storefront Discovery",
      "summary": "Sean transitions to on-site discovery, noting search users convert better, and outlines focus areas of foundation insight, merchant control, and enterprise scale for the future of product discovery.",
      "timerange": "00:34:25.379 - 00:35:19.493"
    },
    {
      "title": "Semantic Search GA And Roadmap",
      "summary": "Sean announces semantic search is generally available with intelligent ranking boosts, and previews upcoming exact search match, enterprise control, EU deployments, and AI explainability features.",
      "timerange": "00:35:21.886 - 00:36:32.708"
    },
    {
      "title": "Semantic Search Customer Results",
      "summary": "Sean showcases a 4x4 accessories customer achieving 93% reduction in zero results, 261% click-through increase, and 58% reduction in inbound customer service calls after enabling semantic search.",
      "timerange": "00:36:34.639 - 00:37:49.247"
    },
    {
      "title": "Intelligent Ranking And Boost Rules",
      "summary": "Sean explains how intelligent ranking balances AI relevance with business priorities, noting customers rely on partners with sandbox environments to configure and preview rule impacts before production.",
      "timerange": "00:37:51.269 - 00:39:01.036"
    },
    {
      "title": "Next Customer Conversations",
      "summary": "Sean poses three qualifying questions for partners to ask customers: how much discovery is happening in AI, can AI understand and recommend products accurately, and where are search and data gaps costing conversion.",
      "timerange": "00:39:04.505 - 00:40:01.852"
    },
    {
      "title": "Agentic Commerce Early Access Programs",
      "summary": "Sean introduces three agentic and conversational commerce EAPs: Storefront MCP, Universal Commerce Protocol led by Google, and Brand Concierge integration, each with specific customer eligibility criteria.",
      "timerange": "00:40:03.333 - 00:43:21.150"
    },
    {
      "title": "Barcelona And London Partner Events",
      "summary": "Sean promotes two free hands-on partner events in September in Barcelona and London, offering direct engineering collaboration on Adobe Commerce as a Cloud Service, Commerce Optimizer, and App Builder.",
      "timerange": "00:43:42.487 - 00:45:14.055"
    },
    {
      "title": "Q&A And Closing Remarks",
      "summary": "Sean and Shannon field questions on contact information and partner managers, encourage registration for the events, and Natalie closes by pointing to the partner experience hub and additional resources.",
      "timerange": "00:45:16.095 - 00:48:16.501"
    }
  ];
const mapChaptersToWebinar = {
  'https://partners.adobe.com/digitalexperience/preview/netstorage-assets/restricted/we/webinar-recording-getting-started-aem-assets-content-hub.mp4': webinarRecordingGettingStartedAemAssetsContentHub,
  'https://partners.adobe.com/digitalexperience/preview/netstorage-assets/restricted/we/webinar-recording-winning-product-discovery-ai-powered-commerce.mp4.html': webinarRecordingWinningProductDiscoveryAiPoweredCommerce,
  'https://partners.adobe.com/digitalexperience/preview/netstorage-assets/restricted/we/webinar-recording-r2s-ajo-email-marketing.mp4.html':marketing,
  'https://partners.adobe.com/digitalexperience/preview/netstorage-assets/restricted/we/webinar-recording-brand-visibility-partner-enablement.mp4.html': webinarRecordingBrandVisibilityPartnerE,
  'https://partners.adobe.com/digitalexperience/preview/netstorage-assets/restricted/we/webinar-recording-ajo-loyalty-enablement.mp4.html': ayoL
};
const miloLibs = getLibs();
const { html, LitElement, unsafeHTML } = await import(`${miloLibs}/deps/lit-all.min.js`);
const PDF_RENDER_DIV_ID = 'adobe-dc-view';
const DEFAULT_BACK_BTN_LABEL = 'Back to previous';
export default class AssetPreview extends LitElement {
  static properties = {
    blockData: { type: Object },
    title: { type: String },
    summary: { type: String },
    description: { type: String },
    fileType: { type: String },
    url: { type: String },
    tags: { type: Array },
    allAssetTags: { type: Array },
    ctaText: { type: String },
    backButtonUrl: { type: String },
    backButtonLabel: { type: String },
    createdDate: { type: Date },
    assetHasData: { type: Boolean },
    isVideoPlaying: { type: Boolean, reflect: true },
    isLoading: { type: Boolean, reflect: true },
    isVideoLoading: { type: Boolean, reflect: true },
    assetPartnerLevel: { type: Array },
    pdfPreviewUrl: { type: String },
    chapters: { type: Object },
  };

  constructor() {
    super();
    this.assetHasData = false;
    this.tags = [];
    this.allAssetTags = [];
    this.allCaaSTags = [];
    this.isVideoPlaying = false;
    this.isVideo = false;
    this.isLoading = true;
    this.isVideoLoading = false;
    this.assetPartnerLevel = [];
    this.pdfPreviewUrl = '';
  }

  createRenderRoot() {
    return this;
  }

  // eslint-disable-next-line class-methods-use-this
  get _video() {
    return document.querySelector('video');
  }

  playVideo() {
    if (this._video) {
      const videoContainer = this._video.closest('.asset-preview-block-video');
      window.scrollTo({ top: videoContainer.offsetTop, behavior: 'smooth' });
      this._video.play();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  timeToSeconds(time) {
    const [hours, minutes, seconds] = time.split(':');

    return (
      Number(hours) * 3600
      + Number(minutes) * 60
      + Number(seconds)
    );
  }

  seekTo(time) {
    const seconds = this.timeToSeconds(time.split('-')[0].trim());
    // const video = this.videoRef.value;
    const video = this._video;

    if (!video) return;

    video.currentTime = seconds;
    video.play();
  }

  async connectedCallback() {
    super.connectedCallback();
    this.setBlockData();
    try {
      const caasTagsResponse = await fetch(
        CAAS_TAGS_URL,
      );
      if (!caasTagsResponse.ok) {
        throw new Error(`Get caas tags HTTP error! Status: ${caasTagsResponse.status}`);
      }
      this.allCaaSTags = await caasTagsResponse.json();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('error', error);
    }
    await this.getAssetMetadata();
    await this.updateComplete;
    const target = document.querySelector('.asset-preview-block-details-left');

    if (target && this.isRestrictedAssetForUser()) {
      target.appendChild(this.fragment);
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('pdfPreviewUrl') && this.pdfPreviewUrl) {
      if (!this.isRestrictedAssetForUser()) {
        this.loadPdfViewer();
      }
    }
  }

  async loadPdfViewer() {
    try {
      // Check if the PDF URL is reachable first
      const res = await fetch(this.pdfPreviewUrl, { method: 'HEAD' });
      const contentType = res.headers.get('Content-Type');

      if (!res.ok || !contentType?.includes('application/pdf')) {
        this.pdfPreviewUrl = '';
        return;
      }

      const { default: initPdfViewer } = await import('../../components/PdfViewer.js');
      await initPdfViewer({
        url: this.pdfPreviewUrl,
        fileName: `${this.title}.pdf`,
        divId: PDF_RENDER_DIV_ID,
        pdfEmbedMode: this.blockData.pdfEmbedMode,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(`PDF viewer failed to load, falling back to preview image: ${e.message}`);
      this.pdfPreviewUrl = '';
    }
  }

  addDynamicKeyForLocalization(key) {
    const localizationKey = `{{${key}}}`;
    if (!this.blockData.localizedText[localizationKey]) {
      this.blockData.localizedText[localizationKey] = key;
    }
  }

  setBlockData() {
    this.fragment = document.querySelector('.fragment');
    this.blockData = { ...this.blockData };

    const blockDataActions = {
      'back-button-url': (cols) => {
        const [backButtonUrlEl] = cols;
        this.blockData.backButtonUrl = backButtonUrlEl.innerText.trim();
      },
      'back-button-label': (cols) => {
        const [backButtonLabelEl] = cols;
        this.blockData.backButtonLabel = backButtonLabelEl.innerText.trim();
        this.addDynamicKeyForLocalization(this.blockData.backButtonLabel);
      },
      'pdf-embed-mode': (cols) => {
        const [pdfEmbedModeEl] = cols;
        this.blockData.pdfEmbedMode = pdfEmbedModeEl?.innerText.trim().toLowerCase().replace(/ /g, '-');
      },
    };
    const rows = Array.from(this.blockData.tableData);
    rows.forEach((row) => {
      const cols = Array.from(row.children);
      const rowTitle = cols[0].innerText.trim().toLowerCase().replace(/ /g, '-');
      const colsContent = cols.slice(1);
      if (blockDataActions[rowTitle]) blockDataActions[rowTitle](colsContent);
    });
  }

  async getAssetMetadata() {
    // for domain we use what is in  window.location.href
    // (this assumes that on cards we have partners.stage.adobe.com or partners.adobe.com
    // on prod caas index we would have only have prod assets, so asset metadata
    // would always be found on prod
    // for stage, we will display also some assets from qa01 or dev02,
    // but will always fetch asset metadata from stage
    // so we should delete assets from lower env if they make us problem on stage
    const mappedAssetUrl = this.getRealAssetUrl();
    if (!mappedAssetUrl) return;
    try {
      await fetch(mappedAssetUrl).then(async (res) => {
        if (res && res.status === 200) {
          const assetMetadata = await res.json();
          await this.setData(assetMetadata);
        }
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(`Error on fetch of asset ${mappedAssetUrl} :`, e);
    }
    this.isLoading = false;
  }

  async setData(assetMetadata) {
    this.title = DOMPurify.sanitize(assetMetadata.title);
    document.title = DOMPurify.sanitize(assetMetadata.title);
    this.summary = DOMPurify.sanitize(assetMetadata.summary)
      || DOMPurify.sanitize(assetMetadata.description);
    this.fileType = DOMPurify.sanitize(assetMetadata.fileType);
    this.url = DOMPurify.sanitize(assetMetadata.url);
    this.webinarPresentation = DOMPurify.sanitize(assetMetadata.webinarPresentation);
    this.previewImage = DOMPurify.sanitize(assetMetadata.previewImage);
    this.blockData.pdfEmbedMode = DOMPurify.sanitize(this.blockData.pdfEmbedMode) || 'full-window';
    this.backButtonUrl = DOMPurify.sanitize(this.blockData.backButtonUrl);
    this.backButtonLabel = DOMPurify.sanitize(
      this.blockData.backButtonLabel || DEFAULT_BACK_BTN_LABEL,
    );
    this.tags = assetMetadata.tags
      ? this.getTagsDisplayValues(this.allCaaSTags, assetMetadata.tags) : [];
    this.allAssetTags = assetMetadata.tags;
    this.ctaText = DOMPurify.sanitize(assetMetadata.ctaText);
    this.size = DOMPurify.sanitize(this.getSizeInMb(assetMetadata.size));
    this.assetPartnerLevel = assetMetadata.partnerLevel
      ?.map((level) => DOMPurify.sanitize(level.toLowerCase()));
    this.createdDate = (() => {
      if (!assetMetadata.createdDate) return '';

      try {
        const date = new Date(assetMetadata.createdDate);
        return date.toLocaleDateString('en-US');
      } catch (error) {
        return '';
      }
    })();
    this.audienceTags = assetMetadata.tags ? this.getTagChildTagsObjects(assetMetadata.tags, this.allCaaSTags, 'caas:audience') : [];
    this.fileFormatTags = assetMetadata.tags ? this.getTagChildTagsObjects(assetMetadata.tags, this.allCaaSTags, 'caas:file-format') : [];
    this.pdfPreviewUrl = DOMPurify.sanitize(assetMetadata.pdfPreviewUrl);
    this.isVideo = this.fileFormatTags && this.fileFormatTags.length && this.fileFormatTags[0].tagId === 'caas:file-format/video';
    if (!assetMetadata.title || !assetMetadata.url) {
      this.assetHasData = false;
    } else {
      this.assetHasData = true;
    }
    this.aemPath = DOMPurify.sanitize(assetMetadata.aemPath);
    // this.chapters = assetMetadata.chapters || [];
    this.chapters = mapChaptersToWebinar[window.location.href];
  }

  // eslint-disable-next-line class-methods-use-this
  getRealAssetUrl() {
    const assetMetadataPath = window.location.href.replace(DIGITALEXPERIENCE_PREVIEW_PATH, PX_ASSETS_PREVIEW_PATH).replace('.html', '/_jcr_content/metadata.assetmetadata.json');
    try {
      const url = new URL(assetMetadataPath);
      const isProd = prodHosts.includes(window.location.host);
      url.hostname = isProd ? PARTNERS_PROD_DOMAIN : PARTNERS_STAGE_DOMAIN;
      url.port = '';
      return url;
    } catch (error) {
      return null;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  _handleImgError = (e) => {
    // eslint-disable-next-line no-console
    console.log('error', e);
    const img = e.currentTarget;
    img.src = transformCardUrl(DEFAULT_BACKGROUND_IMAGE_PATH);
  };

  render() {
    return html`<div class="asset-preview-block-container" daa-lh="Asset preview container | ${this.title}">
      ${this.assetHasData && !this.isLoading ? html`
        <div class="asset-preview-block-header"><p>${this.blockData.localizedText['{{Asset detail}}']}: ${unsafeHTML(this.title)}  ${this.getFileTypeFromTag() ? `(${this.getFileTypeFromTag()})` : ''}</p></div>
        <div class="asset-preview-block-details ">
          <div class="asset-preview-block-details-left">
            ${this.createdDate ? html`<p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Date}}']}: </span>${this.createdDate}</p>` : ''}
            ${this.getTagsTitlesString(this.audienceTags) ? html`<p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Audience}}']}: </span>${unsafeHTML(this.getTagsTitlesString(this.audienceTags))}</p>` : ''}
            ${this.summary ? html`<p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Summary}}']}: </span>${unsafeHTML(this.summary)}</p>` : ''}
            ${this.getTagsTitlesString(this.fileFormatTags) ? html`<p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Type}}']}: </span>${unsafeHTML(this.getTagsTitlesString(this.fileFormatTags))}</p>` : ''}
            ${this.getTagsTitlesString(this.tags) ? html`<p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Tags}}']}: </span>${unsafeHTML(this.getTagsTitlesString(this.tags))}</p>` : ''}
            ${this.size ? html`<p><span class="asset-preview-block-details-left-label">${this.blockData.localizedText['{{Size}}']}: </span class="bold">${unsafeHTML(this.size)}</p>` : ''}

            ${!this.isRestrictedAssetForUser() ? html`
              <div class="asset-preview-block-actions" daa-lh="Asset preview block actions">
                ${this.isPreviewEnabled(this.getFileTypeFromTag()) ? html`<button
                  class="outline" ><a target="_blank" rel="noopener noreferrer" href="${this.getDownloadUrl()}" daa-ll="View"> View </a></button>` : ''}
                ${!this.isVideo ? html`<button class="filled"><a download="${this.title}" href="${this.getDownloadUrl()}" daa-ll="${this.blockData.localizedText[`{{${this.getLabelBasedOnFileExtension(this.url)}}}`]}">${this.blockData.localizedText[`{{${this.getLabelBasedOnFileExtension(this.url)}}}`]}</a></button>` : ''}
                ${this.webinarPresentation ? html`
                  <button class="filled"><a  download="${`${this.title}_presentation`}" href="${this.getWebinarPresentationDownloadUrl()}" daa-ll="${this.blockData.localizedText[`{{${this.getLabelBasedOnFileExtension(this.webinarPresentation)}}}`]}">${this.blockData.localizedText[`{{${this.getLabelBasedOnFileExtension(this.webinarPresentation)}}}`]}</a></button>
                ` : ''}

                ${this.isVideo ? html`
                  <button @click="${() => this.playVideo()}" class="filled" ?disabled="${this.isVideoLoading}">
                    <span>${this.blockData.localizedText['{{Watch Video}}']}</span>
                  </button>
                ` : ''}

                ${this.backButtonUrl ? html`<a
                  class="link" href="${this.backButtonUrl}" daa-ll="${this.blockData.localizedText[`{{${this.backButtonLabel}}}`]}">${this.blockData.localizedText[`{{${this.backButtonLabel}}}`]}</a>` : ''}
              </div>` : ''}
          </div>
          <div class="asset-preview-block-details-right">
            ${this.pdfPreviewUrl && !this.isRestrictedAssetForUser()
              ? html`<div id="${PDF_RENDER_DIV_ID}" class="asset-preview-pdf-viewer"></div>`
              : html`<img src="${transformCardUrl(this.previewImage)}" @error="${this._handleImgError}"/>`
            }
          </div>
        </div>

        ${this.isVideo && !this.isRestrictedAssetForUser() ? html`
            <div class="asset-preview-block-video">
              <div class="video-container video-holder">
                ${this.isVideoLoading ? html`
                  <div class="video-loading-overlay">
                    <div class="video-loading-spinner"></div>
                  </div>
                ` : ''}

                <video
                  preload="auto"
                  @play="${() => { this.isVideoPlaying = true; }}"
                  @pause="${() => { this.isVideoPlaying = false; }}"
                  @loadstart="${() => { this.isVideoLoading = true; }}"
                  @canplay="${() => { this.isVideoLoading = false; }}"
                  @error="${() => { this.isVideoLoading = false; }}"
                  playsinline=""
                  loop=""
                  data-video-source="${this.getDownloadUrl()}"
                  oncontextmenu="return false;"
                  controls
                  controlsList="nodownload"
                >
                  <source src="${this.getDownloadUrl()}" type="${this.fileType}">
                  <source src="${this.getDownloadUrl()}" type="video/mp4">
                </video>
              </div>
              <div class="${this.chapters.length > 0 ? 'video-chapters visible' : 'video-chapters hidden'}">
                ${this.chapters.length > 0 ? this.renderChapters() : ''}
              </div>
            </div>`
    : ''}` : html`<div class="asset-preview-block-header">${this.isLoading ? this.blockData.localizedText['{{Loading data}}'] : this.blockData.localizedText['{{Asset data not found}}']}</div>`}
    `;
  }

  // eslint-disable-next-line class-methods-use-this
  isPreviewEnabled(fileType) {
    const enabledTypes = ['PDF'];
    return enabledTypes.includes(fileType);
  }

  // eslint-disable-next-line class-methods-use-this
  getSizeInMb(size) {
    const sizeInMb = Number(size / (1000 * 1000)).toFixed(1);
    const sizeInKb = Number(size / 1000).toFixed(1);
    return sizeInMb >= 1 ? `${sizeInMb} MB` : `${sizeInKb} KB`;
  }

  getTagsDisplayValues(allTags, tags) {
    const tagsArray = [];
    tags.forEach((tag) => {
      const tagObject = this.findTagByPath(this.allCaaSTags.namespaces.caas.tags, tag)
        || { tagId: tag, title: tag };
      tagsArray.push({ tagId: tag, title: tagObject.title });
    });
    return tagsArray;
  }

  // eslint-disable-next-line class-methods-use-this
  findTagByPath(caasTags, tag) {
    const tagParts = tag.split('caas:')[1].split('/');
    let caasPointer = caasTags;
    // eslint-disable-next-line consistent-return
    tagParts.forEach((tagPart, i) => {
      if (!caasPointer) return null;
      if (tagParts.length - 1 > i) {
        caasPointer = caasPointer[tagPart]?.tags;
      } else {
        caasPointer = caasPointer[tagPart];
      }
    });
    return caasPointer;
  }

  getTagChildTagsObjects(tags, allTags, rootTag) {
    if (!tags) return [];
    const filteredTags = tags.filter((t) => t.startsWith(rootTag));
    const tagsArray = [];
    filteredTags.forEach((tag) => {
      const tagObject = this.findTagByPath(this.allCaaSTags.namespaces.caas.tags, tag)
        || { tagId: tag, title: tag };
      tagsArray.push({
        tagId: DOMPurify.sanitize(tag),
        title: DOMPurify.sanitize(tagObject.title),
      });
    });
    return tagsArray;
  }

  getFileTypeFromTag() {
    // we should always have only one file format tag since it is added based on file type
    // or we should use this.fileType but this has some ugly values (see
    // https://git.corp.adobe.com/wcms/gravity/blob/develop/app-configuration/core/src/main/java/com/adobe/wcm/configuration/utils/CaaSContentDXUtils.java#L52
    if (this.fileFormatTags && this.fileFormatTags.length) { return this.fileFormatTags[0].title; }
    return '';
  }

  // eslint-disable-next-line class-methods-use-this
  getTagsTitlesString(tags) {
    return tags?.map((tag) => DOMPurify.sanitize(tag.title)).join(', ');
  }

  getDownloadUrl() {
    if (!this.url) return '#';
    return this.url;
  }

  getWebinarPresentationDownloadUrl() {
    if (!this.webinarPresentation) return '#';
    return this.webinarPresentation;
  }

  isRestrictedAssetForUser() {
    return !(!this.assetPartnerLevel.length
      || this.assetPartnerLevel.includes('public')
      || this.assetPartnerLevel.includes(PARTNER_LEVEL));
  }

  // eslint-disable-next-line class-methods-use-this
  getLabelBasedOnFileExtension(url) {
    try {
      const { pathname } = new URL(url);
      const fileName = pathname.split('/').pop();
      const parts = fileName.split('.');
      const extension = parts.length > 1 ? parts.pop() : '';

      return FILE_EXTENSION_TO_DOWNLOAD_LABEL[extension] || 'Download';
    } catch (error) {
      return 'Download';
    }
  }

  // eslint-disable-next-line class-methods-use-this
  formatTime(time) {
    const starttime = time.split('-')[0].trim();
    return starttime;
  }

  renderChapters() {
    return this.chapters.map((chapter) => html`
      <div class="chapter" @click="${() => this.seekTo(chapter.timerange)}">
        <div class="chapter-time">${this.formatTime(chapter.timerange)}</div>
        <div class="chapter-title">${chapter.title}</div>
        <div class="chapter-summary">${chapter.summary}</div>
      </div>
    `);
  }
}
