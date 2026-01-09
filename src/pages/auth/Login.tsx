import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

export default function Login() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(1200px 600px at 30% 20%, rgba(255,255,255,0.16), transparent 60%), linear-gradient(135deg, #2CB9B3 0%, #4DBEBC 55%, #2CB9B3 100%)",
        px: 2,
      }}
    >
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Typography sx={{ fontWeight: 900, letterSpacing: 0.4, color: "white" }}>
          vexel
        </Typography>
      </Box>

      <Card sx={{ width: "100%", maxWidth: 430, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Typography sx={{ fontSize: 22, fontWeight: 900 }}>Sign In</Typography>
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
              Sign in to your account to continue.
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Email *"
            placeholder="Enter your Email"
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end">
                    <LockOutlinedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Password *"
            type="password"
            placeholder="Password"
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end">
                    <VisibilityOutlinedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            variant="contained"
            color="secondary"
            sx={{ mt: 2, py: 1.1, textTransform: "none", fontWeight: 900 }}
          >
            Login
          </Button>

          <Divider sx={{ my: 2 }} />

          <Typography sx={{ textAlign: "center", fontSize: 13, color: "text.secondary" }}>
            Don&apos;t have an account yet? <b>Sign Up</b>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}