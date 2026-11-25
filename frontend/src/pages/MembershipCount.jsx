import VerifiedMembersButton from '../components/VerifiedMembersButton'
import '../styles/verified-members.css'

export default function MembershipCount() {
  return (
    <main className="membership-count-page">
      <span className="membership-count-kicker">OUR COMMUNITY</span>
      <h1>Verified Members</h1>
      <p>The live total of active, approved memberships.</p>
      <VerifiedMembersButton />
    </main>
  )
}
