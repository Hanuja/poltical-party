import { Link } from 'react-router-dom'
import Breadcrumb from '../components/Breadcrumb'

export default function About() {
  return (
    <>
      <Breadcrumb items={[{ label: 'About' }]} />
      <section className="section">
        <div className="container text-center">
          <h2>About page - content coming soon</h2>
        </div>
      </section>
    </>
  )
}
