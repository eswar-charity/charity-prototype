import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

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

// Nonprofit screens
import NpLaunchpad from './screens/nonprofits/NpLaunchpad';
import NpProfile from './screens/nonprofits/NpProfile';
import NpActivity from './screens/nonprofits/NpActivity';
import NpApprovals from './screens/nonprofits/NpApprovals';
import NpReviewDetail from './screens/nonprofits/NpReviewDetail';
import NpRequestChanges from './screens/nonprofits/NpRequestChanges';
import NpAutopilot from './screens/nonprofits/NpAutopilot';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Organiser flow */}
        <Route path="/" element={<CreateAccount />} />
        <Route path="/about-you" element={<TellAboutYou />} />
        <Route path="/feed" element={<FeedScreen />} />
        <Route path="/create-event" element={<FeedScreen />} />
        <Route path="/event/step-1" element={<EventStep1 />} />
        <Route path="/event/step-2" element={<EventStep2 />} />
        <Route path="/event/step-3" element={<EventStep3 />} />
        <Route path="/event/step-4" element={<EventStep4 />} />
        <Route path="/approval" element={<ApprovalStatus />} />
        <Route path="/live-dashboard" element={<LiveDashboard />} />
        <Route path="/post-event" element={<PostEventImpact />} />
        <Route path="/profile" element={<ProfileScreen />} />

        {/* Guest flow */}
        <Route path="/guest" element={<Navigate to="/guest/feed" replace />} />
        <Route path="/guest/feed" element={<GuestFeed />} />
        <Route path="/guest/empty" element={<EmptyFeed />} />
        <Route path="/guest/event/live" element={<EventDetailLive />} />
        <Route path="/guest/event/upcoming" element={<EventDetailUpcoming />} />
        <Route path="/guest/event/expired" element={<ExpiredEvent />} />
        <Route path="/guest/share" element={<ShareSheet />} />
        <Route path="/guest/join" element={<IdentityGateJoin />} />
        <Route path="/guest/donate" element={<IdentityGateDonate />} />

        {/* Nonprofit flow */}
        <Route path="/np" element={<Navigate to="/np/home" replace />} />
        <Route path="/np/home" element={<NpLaunchpad />} />
        <Route path="/np/profile" element={<NpProfile />} />
        <Route path="/np/activity" element={<NpActivity />} />
        <Route path="/np/financials" element={<Navigate to="/np/activity" replace />} />
        <Route path="/np/approvals" element={<NpApprovals />} />
        <Route path="/np/approvals/review" element={<NpReviewDetail />} />
        <Route path="/np/approvals/request-changes" element={<NpRequestChanges />} />
        <Route path="/np/settings/autopilot" element={<NpAutopilot />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
