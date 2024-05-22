import { useEffect, useState } from "react";
import "../table_component/style.css";
import axios from "axios";

import { get } from "lodash";

import Pagination from "../pagination";

const Table = () => {
  const [paginatedData, setPaginatedData] = useState([]);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState();

  useEffect(() => {
    fetchTableData(1, pageSize);
  }, []);

  const fetchTableData = async (pageNo = 1, updatedPageSize) => {
    const response = await axios.get(
      `https://openlibrary.org/people/mekBot/books/want-to-read.json?page=${pageNo}&limit=${updatedPageSize}`
    );
    const data = get(response, "data.reading_log_entries", []);
    setTotalCount(get(response, "data.numFound", 0));
    handleAuthorData(data);
  };

  const handleAuthorData = async (booksData) => {
    if (booksData.length) {
      const promises = booksData.map(async (book) => {
        const authorEndPoint = book.work.author_names[0];
        const ratingEndPoint = book.work.key;
        const bookRatingData = await axios.get(
          `https://openlibrary.org/${ratingEndPoint}/ratings.json`
        );
        const rating = get(bookRatingData, "data.summary.average");
        const authorData = await axios.get(
          `https://openlibrary.org/search/authors.json?q=${authorEndPoint}&limit=1`
        );
        // Append the fetched author data to the book object
        return { ...book, author: authorData.data, rating };
      });
      const pageData = await Promise.all(promises);
      setPaginatedData(pageData);
    }
  };

  const onPageClick = (pageNo, updatedPageSize = pageSize) => {
    fetchTableData(pageNo, updatedPageSize);
  };

  const handlePageSize = (e) => {
    setPageSize(e.target.value);
    onPageClick(1, e.target.value);
  };

  return (
    <div>
      <select value={pageSize} onChange={handlePageSize}>
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
      <table className="table_div">
        <thead>
          <tr>
            <th>Author name</th>
            <th>Title</th>
            <th>First publish year</th>
            <th>Subject</th>
            <th>Author birth date</th>
            <th>Author top work</th>
            <th>Rating average</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.length > 0 &&
            paginatedData.map((pageData) => {
              return (
                <tr>
                  <td>{get(pageData, "work.author_names", "-")}</td>
                  <td>{get(pageData, "work.title", "-")}</td>
                  <td>{get(pageData, "work.first_publish_year", "-")}</td>
                  <td>
                    {get(pageData, "author.docs[0].top_subjects[0]", "-")}
                  </td>
                  <td>{get(pageData, "author.docs[0].birth_date", "-")}</td>
                  <td>{get(pageData, "author.docs[0].top_work", "-")}</td>
                  <td>{get(pageData, "rating", "-")}</td>
                </tr>
              );
            })}
        </tbody>
      </table>

      <Pagination
        pages={Math.ceil(totalCount / pageSize)}
        onPageClick={onPageClick}
      />
    </div>
  );
};
export default Table;
