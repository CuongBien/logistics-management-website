using System;

namespace Logistics.Core;

public class Result<T>
{
    public T Value { get; }
    public Error Error { get; }
    public bool IsSuccess => Error == Error.None;
    public bool IsFailure => !IsSuccess;

    protected Result(T value, Error error)
    {
        // Enforce invariants?
        /*
        if (isSuccess && error != Error.None)
            throw new InvalidOperationException();
        if (!isSuccess && error == Error.None)
            throw new InvalidOperationException();
        */
        Value = value;
        Error = error;
    }

    public static Result<T> Success(T value) => new Result<T>(value, Error.None);
    public static Result<T> Failure(Error error) => new Result<T>(default, error);
}

public class Result
{
    public Error Error { get; }
    public bool IsSuccess => Error == Error.None;
    public bool IsFailure => !IsSuccess;

    protected Result(Error error)
    {
        Error = error;
    }

    public static Result Success() => new Result(Error.None);
    public static Result Failure(Error error) => new Result(error);
}
