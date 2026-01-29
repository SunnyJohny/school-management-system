// ContactMe.js
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust the import path as necessary

const ContactMe = () => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'messages'), {
        name,
        company,
        email,
        phone,
        message,
        timestamp: new Date()
      });
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setMessage('');
      toast.success('Message sent successfully!', { position: toast.POSITION.TOP_RIGHT });
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Contact Me</h2>
      <p className="mb-4">You can also reach out via:</p>
      <ul className="mb-4">
        <li>Email: <a href="mailto:johnsunday803@gmail.com" className="text-blue-500">johnsunday803@gmail.com</a></li>
        <li>WhatsApp: <a href="tel:+08030611606" className="text-blue-500">08030611606</a></li>
        <li>Call: <a href="tel:+08030611606" className="text-blue-500">08030611606</a></li>
      </ul>
      <p className="mb-4"> OR Send us a direct message using the form below:</p>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your Name"
          className="p-2 border rounded-lg mb-4"
          required
        />
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company (Optional)"
          className="p-2 border rounded-lg mb-4"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your Email"
          className="p-2 border rounded-lg mb-4"
          required
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Your Phone Number"
          className="p-2 border rounded-lg mb-4"
          required
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows="4"
          placeholder="Type your message here..."
          className="p-2 border rounded-lg mb-4 resize-none"
          required
        />
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <button
  type="submit"
  className={`bg-blue-500 text-white py-2 px-4 rounded-lg ${loading && 'opacity-50 cursor-not-allowed'} mb-6`}
  disabled={loading}
>
  {loading ? 'Sending...' : 'Send Message'}
</button>

      </form>
    </div>
  );
};

export default ContactMe;
