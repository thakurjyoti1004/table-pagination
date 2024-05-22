import { useEffect, useState } from "react";
import "../table_component/style.css";
import axios from "axios";

import { get } from "lodash";

import Pagination from "../pagination";

const Table = () => {
  const [responseData, setResponseData] = useState([]);
  const [paginatedData, setPaginatedData] = useState([]);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchTableData();
  }, []);

  const fetchTableData = async () => {
    const response = await axios.get(
      "https://openlibrary.org/people/mekBot/books/want-to-read.json"
    );
    const data = get(response, "data.reading_log_entries", []);
    setResponseData(data);
    const pageData = data.slice(0, pageSize);
    handleAuthorData(pageData);
  };

  const handleAuthorData = async (booksData) => {
    if (booksData.length) {
      const promises = booksData.map(async (book) => {
        const authorEndPoint = book.work.author_names[0];
        const authorData = await axios.get(
          `https://openlibrary.org/search/authors.json?q=${authorEndPoint}&limit=1`
        );
        // Append the fetched author data to the book object
        return { ...book, author: authorData.data };
      });
      const pageData = await Promise.all(promises);
      setPaginatedData(pageData);
    }
  };

  const onPageClick = (pageNo) => {
    const startIndex = pageSize * (pageNo - 1);
    const endIndex = pageSize * pageNo;
    const pageData = responseData.slice(startIndex, endIndex);
    handleAuthorData(pageData);
  };

  return (
    <div>
      <Pagination
        pages={responseData.length / pageSize}
        onPageClick={onPageClick}
      />
      <table className="table_div">
        <th>Author name</th>
        <th>Title</th>
        <th>First publish year</th>
        <th>Subject</th>
        <th>Author Birth Date</th>
        <th>Author Top Work</th>
        {paginatedData.length > 0 &&
          paginatedData.map((pageData) => {
            return (
              <tbody>
                <tr>
                  <td>{get(pageData, "work.author_names", "-")}</td>
                  <td>{get(pageData, "work.title", "-")}</td>
                  <td>{get(pageData, "work.first_publish_year", "-")}</td>
                  <td>
                    {get(pageData, "author.docs[0].top_subjects", "-").join(
                      ", "
                    )}
                  </td>
                  <td>{get(pageData, "author.docs[0].birth_date", "-")}</td>
                  <td>{get(pageData, "author.docs[0].top_work", "-")}</td>
                </tr>
              </tbody>
            );
          })}
      </table>
    </div>
  );
};
export default Table;
