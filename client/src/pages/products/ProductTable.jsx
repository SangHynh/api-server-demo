import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import TablePagination from "@mui/material/TablePagination";
import { Container, ImageList, ImageListItem, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { apiGetProducts } from "../../apis/products";
import CancelIcon from "@mui/icons-material/Cancel";

function Row(props) {
  const { row } = props;
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row._id}
        </TableCell>
        <TableCell align="right">{row.name}</TableCell>
        <TableCell align="right">{row.price}</TableCell>
        <TableCell align="right">{row.category}</TableCell>
        <TableCell align="right">{row.stock}</TableCell>
        <TableCell align="right">{row.expiryDate}</TableCell>
        <TableCell align="right" sx={{ width: "250px" }}>{row.benefits.join(', ')}</TableCell>
        <TableCell align="right" sx={{ width: "350px" }}>
          {row.description}
        </TableCell>
        <TableCell align="right" sx={{ width: "10px" }}>
          <Tooltip title="Edit">
            <IconButton>
              <EditIcon />
            </IconButton>
          </Tooltip>
        </TableCell>
        <TableCell align="right" sx={{ width: "10px" }}>
          <Tooltip title="Delete">
            <IconButton>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={11}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Variants
              </Typography>
              <Table
                size="small"
                aria-label="purchases"
                sx={{ tableLayout: "fixed", width: "100%" }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Volume</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Stock</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.variants.map((variantRow) => (
                    <TableRow key={variantRow.volume}>
                      <TableCell component="th" scope="row">
                        {variantRow.volume}
                      </TableCell>
                      <TableCell>{variantRow.price}</TableCell>
                      <TableCell>{variantRow.stock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={11}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Ingredients
              </Typography>
              <Table
                size="small"
                aria-label="related-products"
                sx={{ tableLayout: "fixed", width: "100%" }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Percentage</TableCell>
                    <TableCell>Usage Instructions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.relatedProducts &&
                    row.relatedProducts.map((relatedRow) => (
                      <TableRow key={relatedRow.name}>
                        <TableCell component="th" scope="row">
                          {relatedRow.name}
                        </TableCell>
                        <TableCell>{relatedRow.percentage}</TableCell>
                        <TableCell>{relatedRow.usageInstructions}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={11}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Images
              </Typography>
              {/* Image List */}
              {row.images.length > 0 && (
                <ImageList sx={{ height: 250, mt: 2 }} cols={5} rowHeight={150}>
                  {row.images.map((imgSrc, index) => (
                    <ImageListItem key={index}>
                      <img src={imgSrc} alt={`Uploaded ${index}`} loading="lazy" />
                    </ImageListItem>
                  ))}
                </ImageList>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

const ProductTable = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const [products, setProducts] = useState([])

  // GET PRODUCTS
  useEffect(() => {
    const fetchProducts = async () => {
      const response = await apiGetProducts()
      if (response.status === 200) setProducts(response.data)
    }

    fetchProducts()
  }, [])

  return (
    <>
      <TableContainer
        component={Paper}
        style={{ maxHeight: "600px", overflowY: "auto", overflowX: "auto" }}
      >
        <Table aria-label="collapsible table">
          <TableHead
            sx={{
              backgroundColor: "pink",
              position: "sticky",
              top: 0,
            }}
          >
            <TableRow>
              <TableCell />
              <TableCell sx={{ fontWeight: "bold" }}>Id</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Name
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Price
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Category
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Stock
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Expiry Date
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Sales Quality
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Usage Instructions
              </TableCell>
              <TableCell />
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {products
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <Row key={row._id} row={row} />
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={products.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  );
};

export default ProductTable;
