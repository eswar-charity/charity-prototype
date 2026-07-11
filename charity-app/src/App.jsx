import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useIsDesktop from './hooks/useIsDesktop';

// SE (organiser) screens
import CreateAccount from './screens/CreateAccount';
import TellAboutYou from './screens/TellAboutYou';
import FeedScreen from './screens/FeedScreen';
import EventStep1 from './screens/EventStep1';
import EventStep2 from './screens/EventStep2';
import EventStep3 from './screens/EventStep3';
import EventStep4 from './screens/EventStep4';
import ApprovalStatus from './screens/ApprovalStatus';
import LiveDashboard from './screens/LiveDashboard';
import PostEventImpact from './screens/PostEventImpact';
import ProfileScreen from './screens/ProfileScreen';

// Guest screens
import GuestFeed from './screens/guests/GuestFeed';
import EventDetailLive from './screens/guests/EventDetailLive';
import EventDetailUpcoming from './screens/guests/EventDetailUpcoming';
import ShareSheet from './screens/guests/ShareSheet';
import IdentityGateJoin from './screens/guests/IdentityGateJoin';
import IdentityGateDonate from './screens/guests/IdentityGateDonate';
import ExpiredEvent from './screens/guests/ExpiredEvent';
import EmptyFeed from './screens/guests/EmptyFeed';

// Guest screens — desktop layouts (rendered instead of the phone-frame mobile
// screens above once the viewport crosses the desktop breakpoint)
import DesktopGuestFeed from './screens/guests/desktop/DesktopGuestFeed';
import DesktopEventDetail from './screens/guests/desktop/DesktopEventDetail';
import DesktopEventDetailUpcoming from './screens/guests/desktop/DesktopEventDetailUpcoming';
import DesktopOrganizerProfile from './screens/guests/desktop/DesktopOrganizerProfile';
import DesktopIdentityGateJoin from './screens/guests/desktop/DesktopIdentityGateJoin';
import DesktopIdentityGateDonate from './screens/guests/desktop/DesktopIdentityGateDonate';

// SE (organiser) screens — desktop onboarding + "create an event" wizard
import DesktopCreateAccount from './screens/desktop/DesktopCreateAccount';
import DesktopTellAboutYou from './screens/desktop/DesktopTellAboutYou';
import DesktopEventStep1 from './screens/desktop/DesktopEventStep1';
import DesktopEventStep2 from './screens/desktop/DesktopEventStep2';
import DesktopEventStep3 from './screens/desktop/DesktopEventStep3';
import DesktopEventStep4 from './screens/desktop/DesktopEventStep4';
import DesktopApprovalStatus from './screens/desktop/DesktopApprovalStatus';
import DesktopFeedScreen from './screens/desktop/DesktopFeedScreen';
import DesktopPostEventImpact from './screens/desktop/DesktopPostEventImpact';
import DesktopProfileScreen from './screens/desktop/DesktopProfileScreen';
import DesktopLiveDashboard from './screens/desktop/DesktopLiveDashboard';

// Nonprofit screens
import NpLaunchpad from './screens/nonprofits/NpLaunchpad';
import NpProfile from './screens/nonprofits/NpProfile';
import NpActivity from './screens/nonprofits/NpActivity';
import NpApprovals from './screens/nonprofits/NpApprovals';
import NpReviewDetail from './screens/nonprofits/NpReviewDetail';
import NpRequestChanges from './screens/nonprofits/NpRequestChanges';
import NpAutopilot from './screens/nonprofits/NpAutopilot';

// Nonprofit screens — desktop Launchpad dashboard
import DesktopNpLaunchpad from './screens/nonprofits/desktop/DesktopNpLaunchpad';
import DesktopNpApprovals from './screens/nonprofits/desktop/DesktopNpApprovals';
import DesktopNpReviewDetail from './screens/nonprofits/desktop/DesktopNpReviewDetail';
import DesktopNpActivity from './screens/nonprofits/desktop/DesktopNpActivity';
import DesktopNpAutopilot from './screens/nonprofits/desktop/DesktopNpAutopilot';

// Charity Hub Platform Admin — the internal Admin Portal (Blueprint journey #9).
// Desktop-first, responsive; brand-faithful to CharityHub_Branding_Guidelines.
import AdminDashboard from './screens/admin/AdminDashboard';
import AdminReviewQueue from './screens/admin/AdminReviewQueue';
import AdminReviewDetail from './screens/admin/AdminReviewDetail';
import AdminNonprofits from './screens/admin/AdminNonprofits';
import AdminNonprofitDetail from './screens/admin/AdminNonprofitDetail';
import AdminEvents from './screens/admin/AdminEvents';
import AdminExceptions from './screens/admin/AdminExceptions';
import AdminAuditLog from './screens/admin/AdminAuditLog';

// Renders the desktop layout above the desktop breakpoint, the existing
// mobile screen below it. Mobile components are never touched by this switch.
function CreateAccountRoute() {
  return useIsDesktop() ? <DesktopCreateAccount /> : <CreateAccount />;
}
function AboutYouRoute() {
  return useIsDesktop() ? <DesktopTellAboutYou /> : <TellAboutYou />;
}
function GuestFeedRoute() {
  return useIsDesktop() ? <DesktopGuestFeed /> : <GuestFeed />;
}
function EventDetailLiveRoute() {
  return useIsDesktop() ? <DesktopEventDetail /> : <EventDetailLive />;
}
function EventDetailUpcomingRoute() {
  return useIsDesktop() ? <DesktopEventDetailUpcoming /> : <EventDetailUpcoming />;
}
function SeEventDetailLiveRoute() {
  return useIsDesktop() ? <DesktopEventDetail loggedIn /> : <EventDetailLive loggedIn />;
}
function SeEventDetailUpcomingRoute() {
  return useIsDesktop() ? <DesktopEventDetailUpcoming loggedIn /> : <EventDetailUpcoming loggedIn />;
}
function EventStep1Route() {
  return useIsDesktop() ? <DesktopEventStep1 /> : <EventStep1 />;
}
function EventStep2Route() {
  return useIsDesktop() ? <DesktopEventStep2 /> : <EventStep2 />;
}
function EventStep3Route() {
  return useIsDesktop() ? <DesktopEventStep3 /> : <EventStep3 />;
}
function EventStep4Route() {
  return useIsDesktop() ? <DesktopEventStep4 /> : <EventStep4 />;
}
function ApprovalStatusRoute() {
  return useIsDesktop() ? <DesktopApprovalStatus /> : <ApprovalStatus />;
}
function FeedScreenRoute() {
  return useIsDesktop() ? <DesktopFeedScreen /> : <FeedScreen />;
}
function PostEventImpactRoute() {
  return useIsDesktop() ? <DesktopPostEventImpact /> : <PostEventImpact />;
}
function ProfileScreenRoute() {
  return useIsDesktop() ? <DesktopProfileScreen /> : <ProfileScreen />;
}
function LiveDashboardRoute() {
  return useIsDesktop() ? <DesktopLiveDashboard /> : <LiveDashboard />;
}
function NpHomeRoute() {
  return useIsDesktop() ? <DesktopNpLaunchpad /> : <NpLaunchpad />;
}
function NpApprovalsRoute() {
  return useIsDesktop() ? <DesktopNpApprovals /> : <NpApprovals />;
}
function NpReviewDetailRoute() {
  return useIsDesktop() ? <DesktopNpReviewDetail /> : <NpReviewDetail />;
}
function NpActivityRoute() {
  return useIsDesktop() ? <DesktopNpActivity /> : <NpActivity />;
}
function NpAutopilotRoute() {
  return useIsDesktop() ? <DesktopNpAutopilot /> : <NpAutopilot />;
}
function IdentityGateJoinRoute() {
  return useIsDesktop() ? <DesktopIdentityGateJoin /> : <IdentityGateJoin />;
}
function IdentityGateDonateRoute() {
  return useIsDesktop() ? <DesktopIdentityGateDonate /> : <IdentityGateDonate />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Organiser flow */}
        <Route path="/" element={<CreateAccountRoute />} />
        <Route path="/about-you" element={<AboutYouRoute />} />
        <Route path="/feed" element={<FeedScreenRoute />} />
        <Route path="/create-event" element={<FeedScreenRoute />} />
        <Route path="/event/step-1" element={<EventStep1Route />} />
        <Route path="/event/step-2" element={<EventStep2Route />} />
        <Route path="/event/step-3" element={<EventStep3Route />} />
        <Route path="/event/step-4" element={<EventStep4Route />} />
        <Route path="/approval" element={<ApprovalStatusRoute />} />
        <Route path="/live-dashboard" element={<LiveDashboardRoute />} />
        <Route path="/post-event" element={<PostEventImpactRoute />} />
        <Route path="/profile" element={<ProfileScreenRoute />} />
        <Route path="/event/live" element={<SeEventDetailLiveRoute />} />
        <Route path="/event/upcoming" element={<SeEventDetailUpcomingRoute />} />

        {/* Guest flow */}
        <Route path="/guest" element={<Navigate to="/guest/feed" replace />} />
        <Route path="/guest/feed" element={<GuestFeedRoute />} />
        <Route path="/guest/empty" element={<EmptyFeed />} />
        <Route path="/guest/event/live" element={<EventDetailLiveRoute />} />
        <Route path="/guest/event/upcoming" element={<EventDetailUpcomingRoute />} />
        <Route path="/guest/event/expired" element={<ExpiredEvent />} />
        <Route path="/guest/share" element={<ShareSheet />} />
        <Route path="/guest/join" element={<IdentityGateJoinRoute />} />
        <Route path="/guest/donate" element={<IdentityGateDonateRoute />} />
        <Route path="/guest/organizer/:slug" element={<DesktopOrganizerProfile />} />

        {/* Nonprofit flow */}
        <Route path="/np" element={<Navigate to="/np/home" replace />} />
        <Route path="/np/home" element={<NpHomeRoute />} />
        <Route path="/np/profile" element={<NpProfile />} />
        <Route path="/np/activity" element={<NpActivityRoute />} />
        <Route path="/np/financials" element={<Navigate to="/np/activity" replace />} />
        <Route path="/np/approvals" element={<NpApprovalsRoute />} />
        <Route path="/np/approvals/review" element={<NpReviewDetailRoute />} />
        <Route path="/np/approvals/request-changes" element={<NpRequestChanges />} />
        <Route path="/np/settings/autopilot" element={<NpAutopilotRoute />} />

        {/* Charity Hub Platform Admin flow */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/review" element={<AdminReviewQueue />} />
        <Route path="/admin/review/:id" element={<AdminReviewDetail />} />
        <Route path="/admin/nonprofits" element={<AdminNonprofits />} />
        <Route path="/admin/nonprofits/:id" element={<AdminNonprofitDetail />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route path="/admin/exceptions" element={<AdminExceptions />} />
        <Route path="/admin/audit" element={<AdminAuditLog />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
