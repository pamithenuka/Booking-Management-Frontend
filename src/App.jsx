import { useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const initialForm = {
  title: '',
  author: '',
  category: '',
  price: '',
  publishedYear: '',
};

function App() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState('');

  const categories = useMemo(() => {
    return [...new Set(books.map((book) => book.category))].sort();
  }, [books]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (categoryFilter) query.append('category', categoryFilter);
      if (sort) query.append('sort', sort);

      const response = await fetch(`${API_URL}/books?${query.toString()}`);
      const data = await response.json();
      setBooks(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [search, categoryFilter, sort]);

  const validateForm = () => {
    const newErrors = {};

    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.author.trim()) newErrors.author = 'Author is required';
    if (!form.category.trim()) newErrors.category = 'Category is required';
    if (!form.price || Number(form.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    if (
      !form.publishedYear ||
      Number(form.publishedYear) < 1000 ||
      Number(form.publishedYear) > 9999
    ) {
      newErrors.publishedYear = 'Published year must be a valid year';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!validateForm()) return;

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/books/${editingId}` : `${API_URL}/books`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          publishedYear: Number(form.publishedYear),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || {});
        setMessage(data.message || 'Something went wrong');
        return;
      }

      setForm(initialForm);
      setErrors({});
      setEditingId(null);
      setMessage(editingId ? 'Book updated successfully' : 'Book added successfully');
      fetchBooks();
    } catch (error) {
      setMessage('Request failed');
    }
  };

  const handleEdit = (book) => {
    setEditingId(book._id);
    setForm({
      title: book.title,
      author: book.author,
      category: book.category,
      price: book.price,
      publishedYear: book.publishedYear,
    });
    setErrors({});
    setMessage('Editing selected book');
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this book?');
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/books/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setMessage('Book deleted successfully');
      fetchBooks();
    } catch (error) {
      setMessage('Failed to delete book');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setErrors({});
    setMessage('Edit cancelled');
  };

  return (
    <div className="container">
      <header>
        <h1>Book Manager</h1>
        <p>MERN mock lab test practice project</p>
      </header>

      <section className="card">
        <h2>{editingId ? 'Edit Book' : 'Add New Book'}</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <div>
            <label>Title</label>
            <input name="title" value={form.title} onChange={handleChange} />
            {errors.title && <small className="error">{errors.title}</small>}
          </div>

          <div>
            <label>Author</label>
            <input name="author" value={form.author} onChange={handleChange} />
            {errors.author && <small className="error">{errors.author}</small>}
          </div>

          <div>
            <label>Category</label>
            <input name="category" value={form.category} onChange={handleChange} />
            {errors.category && <small className="error">{errors.category}</small>}
          </div>

          <div>
            <label>Price</label>
            <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} />
            {errors.price && <small className="error">{errors.price}</small>}
          </div>

          <div>
            <label>Published Year</label>
            <input name="publishedYear" type="number" value={form.publishedYear} onChange={handleChange} />
            {errors.publishedYear && <small className="error">{errors.publishedYear}</small>}
          </div>

          <div>
            <label>Rank</label>
            <input name="rank" type="number" value={form.rank} onChange={handleChange} />
            {errors.rank && <small className="error">{errors.rank}</small>}
          </div>

          <div className="button-row full-width">
            <button type="submit">{editingId ? 'Update Book' : 'Add Book'}</button>
            {editingId && (
              <button type="button" className="secondary" onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
        {message && <p className="message">{message}</p>}
      </section>

      <section className="card">
        <h2>Search, Filter, and Sort</h2>
        <div className="filter-grid">
          <input
            placeholder="Search by title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </section>

      <section className="card">
        <h2>Book List</h2>
        {loading ? (
          <p>Loading books...</p>
        ) : books.length === 0 ? (
          <p>No books found.</p>
        ) : (
          <div className="book-grid">
            {books.map((book) => (
              <article key={book._id} className="book-card">
                <h3>{book.title}</h3>
                <p><strong>Author:</strong> {book.author}</p>
                <p><strong>Category:</strong> {book.category}</p>
                <p><strong>Price:</strong> Rs. {Number(book.price).toFixed(2)}</p>
                <p><strong>Published Year:</strong> {book.publishedYear}</p>
                <div className="button-row">
                  <button onClick={() => handleEdit(book)}>Edit</button>
                  <button className="danger" onClick={() => handleDelete(book._id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
